
import React, { useState, useEffect, useRef } from 'react';
import { QuizData, Question, QuestionType } from '../types';
import Button from './Button';
import gsap from 'gsap';

interface QuizRunnerProps {
  quizData: QuizData;
  currentIndex: number;
  onSetCurrentIndex: (index: number) => void;
  answers: Record<number, string>;
  onAnswer: (questionId: number, answer: string) => void;
  onFinish: () => void;
  onExit: () => void;
}

const QuizRunner: React.FC<QuizRunnerProps> = ({ 
  quizData, 
  currentIndex, 
  onSetCurrentIndex, 
  answers, 
  onAnswer, 
  onFinish, 
  onExit 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showGrid, setShowGrid] = useState(false);

  const questions = quizData.questions;
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  
  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    if (containerRef.current) {
        gsap.fromTo(containerRef.current,
            { opacity: 0, x: 20 },
            { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
        );
    }
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      onSetCurrentIndex(currentIndex + 1);
    } else {
      onFinish();
    }
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
          <div className="grid gap-3 md:gap-4">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => onAnswer(q.id, opt)}
                className={`w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group ${
                  currentAnswer === opt 
                    ? 'border-[#544230] bg-[#544230] text-[#F5F1E8] shadow-[4px_4px_0px_0px_#A08267] translate-x-[-2px] translate-y-[-2px]' 
                    : 'border-[#C9A585] bg-white hover:border-[#544230] text-[#544230]'
                }`}
              >
                <div className="flex items-center gap-3 md:gap-4">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-black transition-colors flex-shrink-0 ${
                        currentAnswer === opt ? 'border-[#F5F1E8] bg-[#F5F1E8] text-[#544230]' : 'border-[#C9A585] text-[#C9A585]'
                    }`}>
                        {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-bold text-base md:text-lg">{opt}</span>
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
              onChange={(e) => onAnswer(q.id, e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-4 md:p-5 text-lg md:text-xl font-bold border-2 border-[#C9A585] rounded-2xl bg-white focus:outline-none focus:border-[#544230] focus:shadow-[4px_4px_0px_0px_#A08267] transition-all text-[#544230]"
             />
             {currentAnswer && (
                <div className="mt-2 text-sm text-[#A08267] font-medium flex items-center gap-2 animate-fade-in-up">
                   <i className="fas fa-check-circle text-[#544230]"></i>
                   <span>Response saved: "{currentAnswer}"</span>
                </div>
             )}
        </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col justify-center px-0 md:px-4">
      {/* Grid Overlay */}
      {showGrid && (
        <div className="fixed inset-0 z-50 bg-[#544230]/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowGrid(false)}>
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border-2 border-[#544230]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-[#544230] uppercase">Question Map</h3>
                        <p className="text-[#A08267] text-sm font-bold">Jump to any question instantly</p>
                    </div>
                    <button onClick={() => setShowGrid(false)} className="w-10 h-10 rounded-full bg-[#F5F1E8] text-[#544230] hover:bg-[#544230] hover:text-[#F5F1E8] flex items-center justify-center transition-all">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>
                
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                    {questions.map((q, idx) => {
                        const isAnswered = !!answers[q.id];
                        const isCurrent = currentIndex === idx;
                        
                        return (
                            <button 
                                key={q.id}
                                onClick={() => { onSetCurrentIndex(idx); setShowGrid(false); }}
                                className={`
                                    relative w-full aspect-square flex items-center justify-center text-sm font-bold transition-all duration-200
                                    ${isAnswered ? 'bg-[#544230] text-[#F5F1E8] rounded-full shadow-md' : 'text-[#544230] hover:bg-[#F5F1E8] rounded-lg'}
                                    ${isCurrent ? 'ring-2 ring-[#A08267] ring-offset-2 scale-110 z-10' : ''}
                                `}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 pt-6 border-t-2 border-[#544230]/10 flex gap-6 justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-[#544230]"></div>
                        <span className="text-xs font-bold text-[#79614B] uppercase">Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-lg bg-white border border-[#C9A585] flex items-center justify-center text-[#544230] text-[8px] font-bold">1</div>
                        <span className="text-xs font-bold text-[#79614B] uppercase">Unanswered</span>
                    </div>
                </div>
            </div>
        </div>
      )}

      <div className="earth-card rounded-2xl md:rounded-[30px] overflow-hidden flex flex-col min-h-[500px] md:min-h-[600px] relative bg-white">
        
        {/* Header */}
        <div className="px-5 py-4 md:px-8 md:py-6 border-b-2 border-[#544230]/10 flex flex-col md:flex-row justify-between items-center bg-[#F5F1E8] gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
             <div className="text-3xl md:text-4xl font-black text-[#544230]">
                {currentIndex + 1}<span className="text-lg md:text-xl text-[#79614B]/40">/{questions.length}</span>
             </div>
             
             {/* Mobile Map Button placed here for better UX */}
             <button 
                onClick={() => setShowGrid(true)}
                className="md:hidden bg-[#544230] text-[#F5F1E8] w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
              >
                  <i className="fas fa-th"></i>
             </button>

             <div className="hidden md:block h-8 w-px bg-[#79614B]/20"></div>
             <div className="text-xs md:text-sm font-black text-[#A08267] uppercase tracking-wider hidden sm:block">{currentQuestion.type.replace(/_/g, ' ')}</div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
              <div className="text-xs font-bold text-[#79614B] uppercase tracking-wider hidden md:block">
                  {answeredCount} of {questions.length} Answered
              </div>
              <button 
                onClick={() => setShowGrid(true)}
                className="bg-[#544230] text-[#F5F1E8] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#3E3022] transition-colors flex items-center gap-2 shadow-sm"
              >
                  <i className="fas fa-th"></i> Map
              </button>
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
        <div className="p-5 md:p-12 flex-1 flex flex-col justify-center bg-white overflow-y-auto" ref={containerRef}>
          <h2 className="text-2xl md:text-4xl font-black text-[#544230] mb-6 md:mb-10 leading-[1.2]">
            {currentQuestion.question}
          </h2>
          
          <div className="flex-1">
            {renderInput(currentQuestion)}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 md:p-8 border-t-2 border-[#544230]/10 bg-[#F5F1E8] flex justify-between items-center">
           <button onClick={onExit} className="text-[#79614B] hover:text-red-600 font-bold uppercase tracking-wider text-xs md:text-sm transition-colors">
              Menu
           </button>

           <div className="flex gap-3 md:gap-4">
               <Button 
                variant="outline" 
                onClick={() => currentIndex > 0 && onSetCurrentIndex(currentIndex - 1)} 
                disabled={currentIndex === 0}
                className="w-20 md:w-32 px-2 md:px-6 py-2 md:py-3 text-sm"
               >
                Back
               </Button>
               <Button 
                onClick={handleNext}
                className="w-28 md:w-40 px-2 md:px-6 py-2 md:py-3 text-sm"
               >
                {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
               </Button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default QuizRunner;