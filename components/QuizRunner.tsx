import React, { useState, useEffect, useRef } from 'react';
import { QuizData, Question, QuestionType } from '../types';
import Button from './Button';
import gsap from 'gsap';

interface QuizRunnerProps {
  quizData: QuizData;
  onFinish: (answers: Record<number, string>, timeSpent: number) => void;
  onExit: () => void;
  onAddXP: (amount: number) => void;
}

const QuizRunner: React.FC<QuizRunnerProps> = ({ quizData, onFinish, onExit, onAddXP }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeSpent, setTimeSpent] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const questions = quizData.questions;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Live Stats
  const answeredCount = Object.keys(answers).length;
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
        gsap.fromTo(containerRef.current,
            { opacity: 0, x: 20 },
            { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
        );
    }
  }, [currentQuestionIndex]);

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      let quizXp = 0;
      questions.forEach(q => {
         const userAnswer = answers[q.id];
         if (userAnswer && userAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()) {
             quizXp += 10;
         }
      });
      onAddXP(quizXp + 20); 
      onFinish(answers, timeSpent);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOptions = (q: Question) => {
    if (q.type === QuestionType.TrueFalse) {
      return ["True", "False"];
    }
    return q.options || [];
  };

  const renderInput = (q: Question) => {
    const currentAnswer = answers[q.id] || '';
    const options = getOptions(q);

    if (q.type === QuestionType.MultipleChoice || q.type === QuestionType.TrueFalse) {
        return (
          <div className="grid gap-4">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(opt)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group ${
                  currentAnswer === opt 
                    ? 'border-[#544230] bg-[#544230] text-[#F5F1E8] shadow-[4px_4px_0px_0px_#A08267] translate-x-[-2px] translate-y-[-2px]' 
                    : 'border-[#C9A585] bg-white hover:border-[#544230] text-[#544230]'
                }`}
              >
                <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-black transition-colors ${
                        currentAnswer === opt ? 'border-[#F5F1E8] bg-[#F5F1E8] text-[#544230]' : 'border-[#C9A585] text-[#C9A585]'
                    }`}>
                        {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-bold text-lg">{opt}</span>
                </div>
              </button>
            ))}
          </div>
        );
    }
      
    return (
        <div className="mt-4">
             <input
              type="text"
              value={currentAnswer}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-5 text-xl font-bold border-2 border-[#C9A585] rounded-2xl bg-white focus:outline-none focus:border-[#544230] focus:shadow-[4px_4px_0px_0px_#A08267] transition-all text-[#544230]"
             />
        </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col justify-center px-4">
      <div className="earth-card rounded-[30px] overflow-hidden flex flex-col min-h-[600px] relative bg-white">
        
        {/* Header */}
        <div className="px-8 py-6 border-b-2 border-[#544230]/10 flex justify-between items-center bg-[#F5F1E8]">
          <div className="flex items-center gap-4">
             <div className="text-4xl font-black text-[#544230]">
                {currentQuestionIndex + 1}<span className="text-xl text-[#79614B]/40">/{questions.length}</span>
             </div>
             <div className="h-8 w-px bg-[#79614B]/20"></div>
             <div className="text-sm font-black text-[#A08267] uppercase tracking-wider">{currentQuestion.type.replace(/_/g, ' ')}</div>
          </div>
          <div className="flex gap-4">
             <div className="flex flex-col items-end">
                 <span className="text-[10px] font-black uppercase text-[#79614B]/60">Answered</span>
                 <span className="font-bold text-[#544230]">{answeredCount}</span>
             </div>
             <div className="bg-[#544230] text-[#F5F1E8] px-4 py-2 rounded-xl font-mono font-bold shadow-md">
                {formatTime(timeSpent)}
             </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#544230]/5 h-2">
          <div 
            className="bg-[#A08267] h-full transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Question Body */}
        <div className="p-8 md:p-12 flex-1 flex flex-col justify-center bg-white" ref={containerRef}>
          <h2 className="text-3xl md:text-4xl font-black text-[#544230] mb-10 leading-[1.2]">
            {currentQuestion.question}
          </h2>
          
          <div className="flex-1">
            {renderInput(currentQuestion)}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t-2 border-[#544230]/10 bg-[#F5F1E8] flex justify-between items-center">
           <button onClick={onExit} className="text-[#79614B] hover:text-red-600 font-bold uppercase tracking-wider text-sm transition-colors">
              Quit
           </button>

           <div className="flex gap-4">
               <Button 
                variant="outline" 
                onClick={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(prev => prev - 1)} 
                disabled={currentQuestionIndex === 0}
                className="w-32"
               >
                Back
               </Button>
               <Button 
                onClick={handleNext}
                className="w-40"
               >
                {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
               </Button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default QuizRunner;