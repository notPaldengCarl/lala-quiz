import React, { useState, useEffect } from 'react';
import { QuizSettings, QuizData, AppState, FileData, UserStats, Question, QuizSession } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { generateQuiz } from './services/geminiService';
import InputSection from './components/InputSection';
import QuizRunner from './components/QuizRunner';
import FlashcardRunner from './components/FlashcardRunner';
import MemoryMatch from './components/MemoryMatch';
import ResultsView from './components/ResultsView';
import Background from './components/Background';
import LZString from 'lz-string';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Input);
  const [settings, setSettings] = useState<QuizSettings>(DEFAULT_SETTINGS);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // History State
  const [history, setHistory] = useState<QuizSession[]>(() => {
    const saved = localStorage.getItem('quiz_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('quiz_history', JSON.stringify(history));
  }, [history]);

  // Gamification State
  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('quiz_user_stats');
    return saved ? JSON.parse(saved) : { xp: 0, level: 1, streak: 1, questionsAnswered: 0 };
  });

  useEffect(() => {
    localStorage.setItem('quiz_user_stats', JSON.stringify(userStats));
  }, [userStats]);

  // Check for shared quiz in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(shareData);
        if (decompressed) {
          const parsedData: QuizData = JSON.parse(decompressed);
          
          // Generate a session for it
          const sharedSession: QuizSession = {
            id: 'shared-' + Date.now(),
            timestamp: Date.now(),
            title: parsedData.metadata?.source || "Shared Quiz",
            data: parsedData
          };

          // Add to history if not exists
          setHistory(prev => [sharedSession, ...prev]);
          
          // Load immediately
          setQuizData(parsedData);
          setAppState(AppState.Quiz);
          setSuccessMsg("Shared quiz loaded successfully!");
          
          // Clear URL so refresh doesn't reload it
          window.history.replaceState({}, document.title, window.location.pathname);
          
          setTimeout(() => setSuccessMsg(null), 3000);
        }
      } catch (e) {
        console.error("Failed to load shared quiz", e);
        setError("Invalid shared link.");
      }
    }
  }, []);

  const handleAddXP = (amount: number) => {
    setUserStats(prev => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      const xpNeeded = prev.level * 100;
      
      if (newXp >= xpNeeded) {
        newXp -= xpNeeded;
        newLevel += 1;
      }
      return { ...prev, xp: newXp, level: newLevel };
    });
  };

  const handleGenerate = async (text: string, files: FileData[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateQuiz(text, files, settings);
      
      // Save to history
      const newSession: QuizSession = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        title: files.length > 0 ? files[0].name : (text.slice(0, 30) + (text.length > 30 ? '...' : '') || 'Untitled Quiz'),
        data: data
      };
      setHistory(prev => [newSession, ...prev]);

      setQuizData(data);
      setAppState(AppState.Quiz);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = (session: QuizSession) => {
    setQuizData(session.data);
    setUserAnswers({});
    setTimeSpent(0);
    setAppState(AppState.Quiz);
  };

  const deleteSession = (id: string) => {
    setHistory(prev => prev.filter(s => s.id !== id));
  };

  const renameSession = (id: string, newTitle: string) => {
    setHistory(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const shareSession = async (session: QuizSession) => {
    try {
        if (!session.data) throw new Error("No data to share");
        
        const jsonString = JSON.stringify(session.data);
        const compressed = LZString.compressToEncodedURIComponent(jsonString);
        
        if (!compressed) throw new Error("Compression failed");

        const url = `${window.location.origin}${window.location.pathname}?share=${compressed}`;
        
        // Robust Copy Logic
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url);
        } else {
            // Fallback for non-secure contexts
            const textArea = document.createElement("textarea");
            textArea.value = url;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (!successful) throw new Error("Copy failed");
            } catch (err) {
                console.error('Fallback copy failed', err);
                throw new Error("Could not access clipboard");
            }
            document.body.removeChild(textArea);
        }
        
        setSuccessMsg("Shareable link copied to clipboard!");
        setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
        console.error(e);
        setError("Failed to create share link. The quiz might be too large for a URL.");
    }
  };

  const handleQuizFinish = (answers: Record<number, string>, time: number) => {
    const answeredCount = Object.keys(answers).length;
    setUserStats(prev => ({
        ...prev,
        questionsAnswered: prev.questionsAnswered + answeredCount
    }));

    setUserAnswers(answers);
    setTimeSpent(time);
    setAppState(AppState.Results);
  };

  const handleRetake = () => {
    setUserAnswers({});
    setTimeSpent(0);
    setAppState(AppState.Quiz);
  };

  const handleRetakeMissed = (missedQuestions: Question[]) => {
     if (!quizData) return;
     const missedQuizData = {
         ...quizData,
         questions: missedQuestions
     };
     setQuizData(missedQuizData);
     setUserAnswers({});
     setTimeSpent(0);
     setAppState(AppState.Quiz);
  };

  const handleNewQuiz = () => {
    setQuizData(null);
    setUserAnswers({});
    setTimeSpent(0);
    setAppState(AppState.Input);
  };

  return (
    <>
      <Background />
      <div className="h-full flex flex-col relative z-10 overflow-hidden">
        
        {/* Navigation Bar */}
        <header className="bg-[#F5F1E8] border-b-2 border-[#544230]/10 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3 group" onClick={handleNewQuiz} style={{cursor: 'pointer'}}>
              <div className="w-10 h-10 bg-[#544230] rounded-xl flex items-center justify-center text-[#F5F1E8] shadow-md transition-transform group-hover:rotate-6">
                <i className="fas fa-brain text-xl"></i>
              </div>
              <span className="font-black text-[#544230] text-2xl tracking-tight uppercase">LALAQUIZ</span>
            </div>
            
            {quizData && (
              <div className="flex gap-2">
                 {[
                   { label: 'Quiz', state: AppState.Quiz },
                   { label: 'Cards', state: AppState.Flashcards },
                   { label: 'Match', state: AppState.MemoryMatch },
                 ].map(item => (
                   <button 
                    key={item.label}
                    onClick={() => setAppState(item.state)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border-2 transition-all ${
                      appState === item.state 
                        ? 'bg-[#544230] text-[#F5F1E8] border-[#544230]' 
                        : 'bg-white text-[#79614B] border-[#C9A585] hover:border-[#544230]'
                    }`}
                   >
                     {item.label}
                   </button>
                 ))}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 w-full overflow-y-auto custom-scrollbar">
          <div className="container mx-auto px-4 py-8 md:py-10">
            {error && (
              <div className="max-w-4xl mx-auto mb-8 p-4 bg-[#FF4D4D]/10 text-[#9A3B3B] border-2 border-[#9A3B3B] rounded-xl shadow-sm flex justify-between items-center font-bold animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <i className="fas fa-exclamation-circle text-xl"></i>
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#9A3B3B]/10 transition-colors">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
            
            {successMsg && (
              <div className="max-w-4xl mx-auto mb-8 p-4 bg-green-500/10 text-green-700 border-2 border-green-600 rounded-xl shadow-sm flex justify-between items-center font-bold animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <i className="fas fa-check-circle text-xl"></i>
                  <span>{successMsg}</span>
                </div>
                <button onClick={() => setSuccessMsg(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-green-600/10 transition-colors">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}

            {appState === AppState.Input && (
              <InputSection 
                settings={settings}
                onSettingsChange={setSettings}
                onGenerate={handleGenerate}
                isLoading={isLoading}
                userStats={userStats}
                history={history}
                onLoadSession={loadSession}
                onDeleteSession={deleteSession}
                onRenameSession={renameSession}
                onShareSession={shareSession}
              />
            )}

            {appState === AppState.Quiz && quizData && (
              <QuizRunner 
                quizData={quizData} 
                onFinish={handleQuizFinish}
                onExit={handleNewQuiz}
                onAddXP={handleAddXP}
              />
            )}

            {appState === AppState.Flashcards && quizData && (
              <FlashcardRunner 
                quizData={quizData}
                onExit={() => setAppState(AppState.Quiz)}
                onAddXP={handleAddXP}
              />
            )}

            {appState === AppState.MemoryMatch && quizData && (
              <MemoryMatch
                quizData={quizData}
                onExit={() => setAppState(AppState.Quiz)}
                onAddXP={handleAddXP}
              />
            )}

            {appState === AppState.Results && quizData && (
              <ResultsView 
                quizData={quizData}
                userAnswers={userAnswers}
                timeSpent={timeSpent}
                scoringType={settings.scoringType}
                onRetake={handleRetake}
                onNewQuiz={handleNewQuiz}
                onRetakeMissed={handleRetakeMissed}
              />
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default App;