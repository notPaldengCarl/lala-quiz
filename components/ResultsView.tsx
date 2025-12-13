
import React, { useState, useRef, useEffect } from 'react';
import { QuizData, ScoringType, Question } from '../types';
import Button from './Button';
import gsap from 'gsap';
import { normalizeAnswer } from '../utils';

interface ResultsViewProps {
  quizData: QuizData;
  userAnswers: Record<number, string>;
  timeSpent: number;
  scoringType: ScoringType;
  onRetake: () => void;
  onNewQuiz: () => void;
  onRetakeMissed: (missedQuestions: Question[]) => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ 
  quizData, 
  userAnswers, 
  timeSpent,
  scoringType,
  onRetake,
  onNewQuiz,
  onRetakeMissed
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'review' | 'plan'>('stats');
  const scoreRef = useRef<HTMLSpanElement>(null);

  const calculateScore = () => {
    let score = 0;
    let maxScore = 0;
    const missedQuestions: Question[] = [];
    
    quizData.questions.forEach(q => {
      // Fuzzy Comparison using shared utility
      const userAnswerNorm = normalizeAnswer(userAnswers[q.id] || "");
      const correctNorm = normalizeAnswer(q.correct_answer);
      
      const isCorrect = userAnswerNorm === correctNorm;
      
      let points = 1;
      if (scoringType === ScoringType.Weighted) {
        points = (q.type === 'fill_in_blank' || q.type === 'identification') ? 2 : 1;
      }
      maxScore += points;
      if (isCorrect) score += points;
      else missedQuestions.push(q);
    });

    return { score, maxScore, missedQuestions };
  };

  const { score, maxScore, missedQuestions } = calculateScore();
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  useEffect(() => {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: percentage,
      duration: 2,
      ease: "power2.out",
      onUpdate: () => {
        if (scoreRef.current) {
            scoreRef.current.innerText = `${Math.round(obj.val)}%`;
        }
      }
    });
  }, [percentage]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = JSON.stringify(quizData, null, 2);
    downloadFile(data, 'quiz-export.json', 'application/json');
  };

  const exportCSV = () => {
    const headers = ['Question', 'Type', 'Correct Answer', 'Your Answer', 'Is Correct'];
    const rows = quizData.questions.map(q => {
        const u = normalizeAnswer(userAnswers[q.id] || "");
        const c = normalizeAnswer(q.correct_answer);
        return [
            `"${q.question.replace(/"/g, '""')}"`,
            q.type,
            `"${q.correct_answer.replace(/"/g, '""')}"`,
            `"${(userAnswers[q.id] || '').replace(/"/g, '""')}"`,
            u === c ? "TRUE" : "FALSE"
        ];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csvContent, 'quiz-results.csv', 'text/csv');
  };

  return (
    <div className="max-w-4xl mx-auto p-2 md:p-4 animate-fade-in-up">
      <div className="earth-card rounded-2xl md:rounded-[30px] overflow-hidden bg-white">
        
        {/* Header Section */}
        <div className="p-6 md:p-10 bg-[#544230] text-[#F5F1E8] text-center relative overflow-hidden">
            <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-[#79614B] rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-[#A08267] rounded-full opacity-20 blur-3xl"></div>
            
            <div className="relative z-10">
                <div className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-4 opacity-70">Quiz Results</div>
                <div className="text-6xl md:text-[6rem] leading-none font-black mb-4 text-[#A08267]">
                    <span ref={scoreRef}>0%</span>
                </div>
                <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-6 md:mt-8">
                    <div className="bg-white/10 p-3 md:p-4 rounded-xl min-w-[80px] md:min-w-[100px] border border-white/10">
                        <div className="text-[10px] md:text-xs font-bold uppercase opacity-50 mb-1">Score</div>
                        <div className="text-xl md:text-2xl font-black">{score}/{maxScore}</div>
                    </div>
                    <div className="bg-white/10 p-3 md:p-4 rounded-xl min-w-[80px] md:min-w-[100px] border border-white/10">
                        <div className="text-[10px] md:text-xs font-bold uppercase opacity-50 mb-1">Time</div>
                        <div className="text-xl md:text-2xl font-black">{formatTime(timeSpent)}</div>
                    </div>
                    <div className="bg-white/10 p-3 md:p-4 rounded-xl min-w-[80px] md:min-w-[100px] border border-white/10">
                        <div className="text-[10px] md:text-xs font-bold uppercase opacity-50 mb-1">Missed</div>
                        <div className="text-xl md:text-2xl font-black text-[#FF8585]">{missedQuestions.length}</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b-2 border-[#544230]/10 overflow-x-auto no-scrollbar">
            <button 
                onClick={() => setActiveTab('stats')}
                className={`flex-1 min-w-[100px] py-4 md:py-5 text-xs md:text-sm font-black uppercase tracking-wider transition-colors ${activeTab === 'stats' ? 'bg-white text-[#544230] border-b-4 border-[#A08267]' : 'bg-[#F5F1E8] text-[#79614B] hover:bg-[#544230]/5'}`}
            >
                Overview
            </button>
            <button 
                onClick={() => setActiveTab('review')}
                className={`flex-1 min-w-[100px] py-4 md:py-5 text-xs md:text-sm font-black uppercase tracking-wider transition-colors ${activeTab === 'review' ? 'bg-white text-[#544230] border-b-4 border-[#A08267]' : 'bg-[#F5F1E8] text-[#79614B] hover:bg-[#544230]/5'}`}
            >
                Review
            </button>
            <button 
                onClick={() => setActiveTab('plan')}
                className={`flex-1 min-w-[100px] py-4 md:py-5 text-xs md:text-sm font-black uppercase tracking-wider transition-colors ${activeTab === 'plan' ? 'bg-white text-[#544230] border-b-4 border-[#A08267]' : 'bg-[#F5F1E8] text-[#79614B] hover:bg-[#544230]/5'}`}
            >
                Study Plan
            </button>
        </div>

        <div className="p-4 md:p-8 min-h-[400px]">
            {activeTab === 'stats' && (
                <div className="space-y-6 md:space-y-8 animate-fade-in-up">
                    {/* Summary Card */}
                    {quizData.summary && (
                        <div className="bg-[#F5F1E8] p-6 md:p-8 rounded-2xl border border-[#C9A585]">
                            <h4 className="text-[#544230] font-black text-lg md:text-xl mb-4 flex items-center gap-3 uppercase">
                                <i className="fas fa-brain text-[#A08267]"></i> AI Summary
                            </h4>
                            <p className="text-[#544230] text-base md:text-lg font-medium leading-relaxed">{quizData.summary}</p>
                            {quizData.keywords && (
                                <div className="flex flex-wrap gap-2 mt-6">
                                    {quizData.keywords.map((k, i) => (
                                        <span key={i} className="px-3 py-1 bg-white border border-[#C9A585] rounded-lg text-[10px] md:text-xs font-bold uppercase text-[#79614B] shadow-sm">
                                            #{k}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Action Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-4">
                            <h5 className="font-bold uppercase text-[#79614B] text-xs">Actions</h5>
                            <button 
                                onClick={() => onRetakeMissed(missedQuestions)}
                                disabled={missedQuestions.length === 0}
                                className="w-full p-5 md:p-6 rounded-2xl border-2 border-[#9A3B3B] bg-[#9A3B3B] text-white hover:bg-[#7a2e2e] transition-all text-left shadow-md disabled:opacity-50 disabled:shadow-none"
                            >
                                <div className="font-black text-lg md:text-xl mb-1 uppercase">Retake Missed</div>
                                <div className="text-white/80 text-sm font-medium">Answer {missedQuestions.length} wrong questions</div>
                            </button>
                            <button 
                                onClick={onRetake}
                                className="w-full p-5 md:p-6 rounded-2xl border-2 border-[#C9A585] bg-white text-[#544230] hover:border-[#544230] transition-all text-left shadow-sm hover:shadow-md"
                            >
                                <div className="font-black text-lg md:text-xl mb-1 uppercase">Retake Full Quiz</div>
                                <div className="text-[#79614B] text-sm font-medium">Start over fresh</div>
                            </button>
                         </div>

                         <div className="space-y-4">
                            <h5 className="font-bold uppercase text-[#79614B] text-xs">Export</h5>
                            <button onClick={exportJSON} className="w-full p-4 rounded-xl border-2 border-[#C9A585] bg-white hover:border-[#544230] font-bold flex items-center justify-between group text-[#544230]">
                                <span>Export as JSON</span>
                                <i className="fas fa-file-code text-[#A08267] group-hover:scale-110 transition-transform"></i>
                            </button>
                            <button onClick={exportCSV} className="w-full p-4 rounded-xl border-2 border-[#C9A585] bg-white hover:border-[#544230] font-bold flex items-center justify-between group text-[#544230]">
                                <span>Export as CSV</span>
                                <i className="fas fa-file-csv text-[#A08267] group-hover:scale-110 transition-transform"></i>
                            </button>
                         </div>
                    </div>
                </div>
            )}

            {activeTab === 'review' && (
                <div className="space-y-4 animate-fade-in-up">
                    {quizData.questions.map((q, idx) => {
                        const userAnswerNorm = normalizeAnswer(userAnswers[q.id] || "");
                        const correctNorm = normalizeAnswer(q.correct_answer);
                        const isCorrect = userAnswerNorm === correctNorm;
                        
                        return (
                            <div key={q.id} className={`p-4 md:p-6 rounded-2xl border-2 ${isCorrect ? 'border-[#C9A585] bg-[#F5F9F5]' : 'border-[#9A3B3B]/30 bg-[#FFF5F5]'}`}>
                                <div className="flex gap-4">
                                    <div className={`mt-1 w-6 h-6 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center text-xs md:text-sm font-black flex-shrink-0 ${isCorrect ? 'border-green-500 bg-green-500 text-white' : 'border-[#9A3B3B] bg-[#9A3B3B] text-white'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-[#544230] text-base md:text-lg mb-4">{q.question}</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="bg-white p-3 rounded-lg border border-[#C9A585]">
                                                <div className="font-black text-[10px] uppercase opacity-50 mb-1 text-[#79614B]">Your Answer</div>
                                                <div className={`font-bold ${isCorrect ? 'text-green-700' : 'text-[#9A3B3B]'} break-words`}>{userAnswers[q.id] || '-'}</div>
                                            </div>
                                            {!isCorrect && (
                                                <div className="bg-white p-3 rounded-lg border border-[#C9A585]">
                                                    <div className="font-black text-[10px] uppercase opacity-50 mb-1 text-[#79614B]">Correct Answer</div>
                                                    <div className="font-bold text-green-700 break-words">{q.correct_answer}</div>
                                                </div>
                                            )}
                                        </div>
                                        {q.explanation && (
                                            <div className="mt-4 p-3 bg-[#544230]/5 rounded-lg text-sm text-[#544230] font-medium border border-[#544230]/10">
                                                <i className="fas fa-info-circle mr-2 text-[#A08267]"></i> {q.explanation}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'plan' && (
                <div className="animate-fade-in-up">
                    {!quizData.study_plan || quizData.study_plan.length === 0 ? (
                         <div className="text-center py-10 opacity-50 font-bold text-[#544230]">
                            No study plan generated for this set.
                         </div>
                    ) : (
                        <div className="relative border-l-4 border-[#C9A585] ml-2 md:ml-4 space-y-6 md:space-y-8 py-4">
                            {quizData.study_plan.map((item, idx) => (
                                <div key={idx} className="relative pl-6 md:pl-8">
                                    <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-[#544230] border-4 border-[#F5F1E8]"></div>
                                    <div className="bg-[#F5F1E8] border border-[#C9A585] rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="text-xs font-black uppercase text-[#A08267] tracking-wider mb-2">{item.day}</div>
                                        <h4 className="text-lg font-bold text-[#544230] mb-2">{item.topic}</h4>
                                        <p className="text-[#79614B] text-sm md:text-base">{item.activity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 md:p-8 bg-[#544230] flex justify-center gap-4">
            <Button variant="secondary" onClick={onNewQuiz} className="w-full md:w-48">New Quiz</Button>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;