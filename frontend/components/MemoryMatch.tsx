import React, { useState, useEffect, useRef } from 'react';
import { QuizData, Question } from '../types';
import Button from './Button';
import gsap from 'gsap';

interface MemoryMatchProps {
  quizData: QuizData;
  onExit: () => void;
  onAddXP: (amount: number) => void;
}

interface CardItem {
  id: string;
  content: string;
  matchId: number;
  type: 'question' | 'answer';
  isMatched: boolean;
  isOpen: boolean;
}

const MemoryMatch: React.FC<MemoryMatchProps> = ({ quizData, onExit, onAddXP }) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [openCards, setOpenCards] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize game
    const gamePairs: CardItem[] = [];
    // Take up to 8 pairs to keep the grid manageable (16 cards total)
    const questionsToUse = quizData.questions.slice(0, 8);

    questionsToUse.forEach(q => {
      gamePairs.push({
        id: `q-${q.id}`,
        content: q.question,
        matchId: q.id,
        type: 'question',
        isMatched: false,
        isOpen: false,
      });
      gamePairs.push({
        id: `a-${q.id}`,
        content: q.correct_answer,
        matchId: q.id,
        type: 'answer',
        isMatched: false,
        isOpen: false,
      });
    });

    // Shuffle
    setCards(gamePairs.sort(() => Math.random() - 0.5));
    
    // Entrance Animation
    if (containerRef.current) {
        gsap.fromTo(containerRef.current, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5 });
    }
  }, [quizData]);

  const handleCardClick = (id: string) => {
    if (isProcessing || openCards.includes(id) || cards.find(c => c.id === id)?.isMatched) return;

    // Flip card open
    const newCards = cards.map(c => c.id === id ? { ...c, isOpen: true } : c);
    setCards(newCards);
    
    const newOpenCards = [...openCards, id];
    setOpenCards(newOpenCards);

    if (newOpenCards.length === 2) {
      setIsProcessing(true);
      checkForMatch(newOpenCards, newCards);
    }
  };

  const checkForMatch = (currentOpen: string[], currentCards: CardItem[]) => {
    const card1 = currentCards.find(c => c.id === currentOpen[0]);
    const card2 = currentCards.find(c => c.id === currentOpen[1]);

    if (card1 && card2 && card1.matchId === card2.matchId) {
      // Match found
      setTimeout(() => {
        setCards(prev => prev.map(c => 
          c.id === card1.id || c.id === card2.id 
            ? { ...c, isMatched: true, isOpen: false } 
            : c
        ));
        setOpenCards([]);
        setIsProcessing(false);
        onAddXP(15); // Bonus XP for matching
        
        // Sound or visual feedback here could be added
      }, 800);
    } else {
      // No match
      setTimeout(() => {
        setCards(prev => prev.map(c => 
          currentOpen.includes(c.id) ? { ...c, isOpen: false } : c
        ));
        setOpenCards([]);
        setIsProcessing(false);
      }, 1000);
    }
  };

  const allMatched = cards.length > 0 && cards.every(c => c.isMatched);

  return (
    <div className="max-w-5xl mx-auto p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-3xl font-extrabold text-[#544230]">Memory Match</h2>
           <p className="text-[#79614B] text-sm font-medium">Find the matching Question and Answer pairs!</p>
        </div>
        <Button variant="outline" onClick={onExit} className="text-sm">Exit Game</Button>
      </div>

      {allMatched ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white/50 rounded-[2rem] border border-[#544230]/10 p-10 animate-fade-in-up">
           <div className="w-24 h-24 bg-[#544230] rounded-full flex items-center justify-center mb-6 shadow-xl">
              <i className="fas fa-trophy text-4xl text-[#F5F1E8]"></i>
           </div>
           <h3 className="text-4xl font-black text-[#544230] mb-4">Level Cleared!</h3>
           <p className="text-[#A08267] font-bold text-lg mb-8">You found all the pairs.</p>
           <Button onClick={onExit} className="px-8 py-3 text-lg">Back to Menu</Button>
        </div>
      ) : (
        <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-fr flex-1 pb-8">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`relative cursor-pointer perspective-1000 group min-h-[120px] ${card.isMatched ? 'invisible' : ''}`}
            >
              <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${card.isOpen ? 'rotate-y-180' : ''}`}>
                {/* Back of Card (Hidden) */}
                <div className="absolute w-full h-full bg-[#544230] rounded-xl shadow-md border-2 border-[#79614B] flex items-center justify-center backface-hidden hover:bg-[#3E3022] transition-colors">
                   <i className="fas fa-question text-[#F5F1E8]/30 text-4xl"></i>
                </div>

                {/* Front of Card (Visible) */}
                <div className={`absolute w-full h-full bg-[#F5F1E8] rounded-xl shadow-xl border-2 ${card.type === 'question' ? 'border-[#A08267]' : 'border-[#544230]'} p-4 flex items-center justify-center text-center backface-hidden rotate-y-180`}>
                   <span className="text-[#544230] font-bold text-sm md:text-base leading-tight select-none">
                     {card.content.length > 60 ? card.content.substring(0, 60) + '...' : card.content}
                   </span>
                   <span className={`absolute top-2 right-2 text-[10px] font-black uppercase tracking-wider px-1.5 rounded ${card.type === 'question' ? 'bg-[#A08267]/20 text-[#A08267]' : 'bg-[#544230]/20 text-[#544230]'}`}>
                      {card.type === 'question' ? 'Q' : 'A'}
                   </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoryMatch;