import React, { useState, useEffect } from 'react';
import { QuizData, Question } from '../types';
import Button from './Button';

interface FlashcardRunnerProps {
  quizData: QuizData;
  onExit: () => void;
  onAddXP: (amount: number) => void;
}

interface CardStatus {
  [id: number]: 'learning' | 'mastered';
}

const FlashcardRunner: React.FC<FlashcardRunnerProps> = ({ quizData, onExit, onAddXP }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStatus, setCardStatus] = useState<CardStatus>({});
  const [activeDeck, setActiveDeck] = useState<Question[]>(quizData.questions);
  const [showMastered, setShowMastered] = useState(true);

  const currentCard = activeDeck[currentIndex];

  useEffect(() => {
    // Filter deck when toggle changes
    if (!showMastered) {
      const learningCards = quizData.questions.filter(q => !cardStatus[q.id] || cardStatus[q.id] === 'learning');
      setActiveDeck(learningCards.length > 0 ? learningCards : quizData.questions);
      setCurrentIndex(0);
    } else {
      setActiveDeck(quizData.questions);
    }
  }, [showMastered, cardStatus, quizData.questions]);

  const handleNext = () => {
    setIsFlipped(false);
    stopSpeech();
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % activeDeck.length);
    }, 200);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    stopSpeech();
    setTimeout(() => {
       setCurrentIndex((prev) => (prev - 1 + activeDeck.length) % activeDeck.length);
    }, 200);
  };

  const markCard = (status: 'learning' | 'mastered') => {
    if (status === 'mastered' && (!cardStatus[currentCard.id] || cardStatus[currentCard.id] === 'learning')) {
        onAddXP(5); // XP for mastering a card
    }
    setCardStatus(prev => ({ ...prev, [currentCard.id]: status }));
    handleNext();
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col items-center justify-center p-4">
      <div className="w-full flex justify-between items-center mb-6">
        <div>
            <h2 className="text-3xl font-extrabold text-[#544230]">Study Deck</h2>
            <div className="flex items-center gap-2 mt-1">
                <label className="text-xs font-bold text-[#A08267] uppercase tracking-wide flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={!showMastered} 
                        onChange={() => setShowMastered(!showMastered)} 
                        className="rounded text-[#544230] focus:ring-[#A08267]" 
                    />
                    Hide Mastered Cards
                </label>
            </div>
        </div>
        <Button variant="outline" onClick={onExit} className="text-sm py-1.5 px-4">Exit</Button>
      </div>

      <div className="perspective-1000 w-full h-[500px] cursor-pointer group relative" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ease-[cubic-bezier(0.23,1,0.32,1)] ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <div className="absolute w-full h-full bg-[#F5F1E8] rounded-[2rem] shadow-2xl p-10 flex flex-col items-center justify-center backface-hidden border border-[#C9A585]/30">
             <div className="absolute top-8 left-8 text-xs font-black text-[#A08267] uppercase tracking-[0.2em]">Question</div>
             <div 
                className="absolute top-8 right-8 w-8 h-8 rounded-full bg-[#C9A585]/20 flex items-center justify-center hover:bg-[#C9A585]/40 transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); speak(currentCard.question); }}
             >
                <i className="fas fa-volume-up text-[#544230]"></i>
             </div>

             <p className="text-3xl font-bold text-center text-[#544230] leading-snug">
               {currentCard.question}
             </p>
             <div className="absolute bottom-8 flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-[#A08267] uppercase tracking-wider">Tap to Flip</span>
             </div>
          </div>

          {/* Back */}
          <div className="absolute w-full h-full bg-[#544230] rounded-[2rem] shadow-2xl p-10 flex flex-col items-center justify-center backface-hidden rotate-y-180 border border-[#79614B]">
            <div className="absolute top-8 left-8 text-xs font-black text-[#A08267] uppercase tracking-[0.2em]">Answer</div>
            <div 
                className="absolute top-8 right-8 w-8 h-8 rounded-full bg-[#F5F1E8]/10 flex items-center justify-center hover:bg-[#F5F1E8]/20 transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); speak(currentCard.correct_answer + ". " + (currentCard.explanation || "")); }}
             >
                <i className="fas fa-volume-up text-[#F5F1E8]"></i>
             </div>
            
            <div className="flex-1 flex flex-col items-center justify-center w-full overflow-y-auto custom-scrollbar">
                <p className="text-2xl font-bold text-center text-[#F5F1E8] leading-relaxed mb-6">
                {currentCard.correct_answer}
                </p>
                
                {currentCard.explanation && (
                    <div className="w-full pt-6 border-t border-[#79614B]/50">
                        <p className="text-lg text-[#C9A585] text-center font-medium leading-relaxed">
                            {currentCard.explanation}
                        </p>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Smart Rating Controls */}
      <div className="mt-8 flex items-center justify-between w-full max-w-xl px-4 gap-4">
         <Button variant="outline" onClick={handlePrev} icon={<i className="fas fa-arrow-left"></i>} className="rounded-full w-12 h-12 p-0 flex items-center justify-center">
         </Button>
         
         <div className="flex gap-4">
             <button 
                onClick={() => markCard('learning')}
                className="flex flex-col items-center gap-1 group"
             >
                 <div className="w-14 h-14 rounded-2xl bg-[#9A3B3B]/10 border-2 border-[#9A3B3B] flex items-center justify-center text-[#9A3B3B] group-hover:bg-[#9A3B3B] group-hover:text-white transition-all">
                    <i className="fas fa-times text-xl"></i>
                 </div>
                 <span className="text-[10px] font-bold uppercase text-[#9A3B3B] tracking-wide">Study Again</span>
             </button>

             <button 
                onClick={() => markCard('mastered')}
                className="flex flex-col items-center gap-1 group"
             >
                 <div className="w-14 h-14 rounded-2xl bg-[#544230]/10 border-2 border-[#544230] flex items-center justify-center text-[#544230] group-hover:bg-[#544230] group-hover:text-[#F5F1E8] transition-all">
                    <i className="fas fa-check text-xl"></i>
                 </div>
                 <span className="text-[10px] font-bold uppercase text-[#544230] tracking-wide">Got It</span>
             </button>
         </div>
         
         <Button variant="outline" onClick={handleNext} className="rounded-full w-12 h-12 p-0 flex items-center justify-center">
            <i className="fas fa-arrow-right"></i>
         </Button>
      </div>
      
      <div className="mt-4 text-[#79614B] font-bold text-sm">
         {currentIndex + 1} / {activeDeck.length}
      </div>
    </div>
  );
};

export default FlashcardRunner;