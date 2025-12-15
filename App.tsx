
import React, { useState, useEffect } from 'react';
import { QuizSettings, QuizData, AppState, FileData, UserStats, Question, QuizSession } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { generateQuiz } from './services/geminiService';
import { compressQuizData, decompressQuizData } from './services/sharingService';
import InputSection from './components/InputSection';
import QuizRunner from './components/QuizRunner';
import FlashcardRunner from './components/FlashcardRunner';
import MemoryMatch from './components/MemoryMatch';
import ResultsView from './components/ResultsView';
import Background from './components/Background';
import Preloader from './components/Preloader';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Input);
  const [settings, setSettings] = useState<QuizSettings>(DEFAULT_SETTINGS);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  
  // Lifted State for Persistence
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Constructing Knowledge");
  const [showPreloader, setShowPreloader] = useState(true); // Initial load
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Notification Modal State
  const [showReminderModal, setShowReminderModal] = useState(false);
  
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

  // Initial Preloader Timer (only runs once on mount)
  useEffect(() => {
    const t = setTimeout(() => setShowPreloader(false), 2000);
    return () => clearTimeout(t);
  }, []);

  // Global Timer for Quiz Mode
  useEffect(() => {
    let timer: any;
    if (appState === AppState.Quiz) {
      timer = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [appState]);

  // Check for shared quiz in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
      // Force preloader on if handling a share link
      setLoadingMessage("Loading Shared Quiz...");
      setShowPreloader(true);
      try {
        const parsedData = decompressQuizData(shareData);
        
        if (parsedData) {
          const sharedSession: QuizSession = {
            id: 'shared-' + Date.now(),
            timestamp: Date.now(),
            title: parsedData.metadata?.source || "Shared Quiz",
            data: parsedData
          };

          setHistory(prev => [sharedSession, ...prev]);
          setQuizData(parsedData);
          setCurrentQuizIndex(0);
          setCurrentFlashcardIndex(0);
          setAppState(AppState.Quiz);
          setSuccessMsg("Shared quiz loaded successfully!");
          
          // Clear URL to keep address bar clean
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            throw new Error("Data corruption");
        }
      } catch (e) {
        console.error("Failed to load shared quiz", e);
        setError("Invalid or expired shared link.");
      } finally {
        setTimeout(() => setShowPreloader(false), 1500);
        setTimeout(() => setSuccessMsg(null), 3000);
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

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        setError("This browser does not support desktop notifications");
        return;
    }

    if (Notification.permission === "granted") {
        setShowReminderModal(true);
    } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            setShowReminderModal(true);
        }
    }
  };

  const scheduleNotification = (minutes: number) => {
      setShowReminderModal(false);
      setSuccessMsg(`Study reminder set for ${minutes} minutes!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      
      setTimeout(() => {
          new Notification("LalaQuiz Study Reminder", {
              body: "Time to get back to learning! Keep your streak alive. 🚀",
              icon: "/favicon.ico"
          });
      }, minutes * 60000);
  };

  const handleGenerate = async (text: string, files: FileData[]) => {
    setIsLoading(true);
    if (files.length > 0) {
        setLoadingMessage("Reading Files & Generating...");
    } else {
        setLoadingMessage("Analyzing Content & Generating...");
    }
    setShowPreloader(true); 
    setError(null);
    try {
      const data = await generateQuiz(text, files, settings);
      
      const newSession: QuizSession = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        title: files.length > 0 ? files[0].name : (text.slice(0, 30) + (text.length > 30 ? '...' : '') || 'Untitled Quiz'),
        data: data
      };
      setHistory(prev => [newSession, ...prev]);

      setQuizData(data);
      setCurrentQuizIndex(0);
      setCurrentFlashcardIndex(0);
      setUserAnswers({});
      setTimeSpent(0);
      setAppState(AppState.Quiz);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
      setTimeout(() => setShowPreloader(false), 500); // Small delay for smooth exit
    }
  };

  const loadSession = (session: QuizSession) => {
    setQuizData(session.data);
    setUserAnswers({});
    setCurrentQuizIndex(0);
    setCurrentFlashcardIndex(0);
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
        
        const compressed = compressQuizData(session.data);
        const url = `${window.location.origin}${window.location.pathname}?share=${compressed}`;
        
        if (url.length > 10000000) {
           setError("Quiz is too large for a link. Try exporting as JSON.");
           return;
        }

        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url);
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = url;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
            } catch (err) {
                console.error('Fallback copy failed', err);
            }
            document.body.removeChild(textArea);
        }
        
        setSuccessMsg("Link copied! (Optimized & Shortened)");
        setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
        console.error(e);
        setError("Failed to create share link.");
    }
  };

  const handleHeaderShare = () => {
    if (quizData) {
        const tempSession: QuizSession = {
            id: 'current-view',
            timestamp: Date.now(),
            title: quizData.metadata.source,
            data: quizData
        };
        shareSession(tempSession);
    }
  };

  const handleQuizAnswer = (questionId: number, answer: string) => {
      setUserAnswers(prev => ({...prev, [questionId]: answer}));
  };

  const handleQuizFinish = () => {
    const answeredCount = Object.keys(userAnswers).length;
    setUserStats(prev => ({
        ...prev,
        questionsAnswered: prev.questionsAnswered + answeredCount
    }));
    handleAddXP(10);
    setAppState(AppState.Results);
  };

  const handleRetake = () => {
    setUserAnswers({});
    setCurrentQuizIndex(0);
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
     setCurrentQuizIndex(0);
     setTimeSpent(0);
     setAppState(AppState.Quiz);
  };

  const handleNewQuiz = () => {
    setQuizData(null);
    setUserAnswers({});
    setCurrentQuizIndex(0);
    setCurrentFlashcardIndex(0);
    setTimeSpent(0);
    setAppState(AppState.Input);
  };

  return (
    <>
      <Background />
      {showPreloader && <Preloader message={loadingMessage} />}
      
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#544230]/40 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border-2 border-[#544230] animate-fade-in-up">
              <h3 className="text-xl font-black text-[#544230] mb-2 flex items-center gap-2">
                 <i className="fas fa-bell text-[#A08267]"></i> Set Reminder
              </h3>
              <p className="text-[#79614B] mb-6 font-medium">When should we remind you to study?</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                 <button onClick={() => scheduleNotification(15)} className="p-3 rounded-xl border-2 border-[#C9A585] text-[#544230] font-bold hover:bg-[#F5F1E8] hover:border-[#544230] transition-all">15 Mins</button>
                 <button onClick={() => scheduleNotification(30)} className="p-3 rounded-xl border-2 border-[#C9A585] text-[#544230] font-bold hover:bg-[#F5F1E8] hover:border-[#544230] transition-all">30 Mins</button>
                 <button onClick={() => scheduleNotification(60)} className="p-3 rounded-xl border-2 border-[#C9A585] text-[#544230] font-bold hover:bg-[#F5F1E8] hover:border-[#544230] transition-all">1 Hour</button>
                 <button onClick={() => scheduleNotification(120)} className="p-3 rounded-xl border-2 border-[#C9A585] text-[#544230] font-bold hover:bg-[#F5F1E8] hover:border-[#544230] transition-all">2 Hours</button>
              </div>
              
              <button 
                onClick={() => setShowReminderModal(false)}
                className="w-full py-3 text-[#A08267] font-bold hover:text-[#544230]"
              >
                Cancel
              </button>
           </div>
        </div>
      )}

      <div className="h-full flex flex-col relative z-10 overflow-hidden">
        
        <header className="bg-[#F5F1E8] border-b-2 border-[#544230]/10 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-3 group" onClick={handleNewQuiz} style={{cursor: 'pointer'}}>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-[#544230] rounded-lg md:rounded-xl flex items-center justify-center text-[#F5F1E8] shadow-md transition-transform group-hover:rotate-6">
                <i className="fas fa-brain text-base md:text-xl"></i>
              </div>
              <span className="font-black text-[#544230] text-xl md:text-2xl tracking-tight uppercase">LALAQUIZ</span>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4">
                <button 
                    onClick={requestNotificationPermission}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#C9A585] text-[#A08267] flex items-center justify-center hover:bg-[#544230] hover:text-[#F5F1E8] hover:border-[#544230] transition-all"
                    title="Set Custom Reminder"
                >
                    <i className="fas fa-bell text-sm md:text-base"></i>
                </button>
                
                {quizData && (
                    <button 
                        onClick={handleHeaderShare}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#C9A585] text-[#A08267] flex items-center justify-center hover:bg-[#544230] hover:text-[#F5F1E8] hover:border-[#544230] transition-all"
                        title="Share this Quiz"
                    >
                        <i className="fas fa-share-alt text-sm md:text-base"></i>
                    </button>
                )}

                {quizData && (
                <div className="flex gap-1 md:gap-2">
                    {[
                    { label: 'Quiz', state: AppState.Quiz },
                    { label: 'Cards', state: AppState.Flashcards },
                    { label: 'Match', state: AppState.MemoryMatch },
                    ].map(item => (
                    <button 
                        key={item.label}
                        onClick={() => setAppState(item.state)}
                        className={`px-3 py-1 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider border-2 transition-all ${
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
          </div>
        </header>

        <main className="flex-1 w-full overflow-y-auto custom-scrollbar">
          <div className="container mx-auto px-4 py-6 md:py-10">
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
                currentIndex={currentQuizIndex}
                onSetCurrentIndex={setCurrentQuizIndex}
                answers={userAnswers}
                onAnswer={handleQuizAnswer}
                onFinish={handleQuizFinish}
                onExit={handleNewQuiz}
              />
            )}

            {appState === AppState.Flashcards && quizData && (
              <FlashcardRunner 
                quizData={quizData}
                currentIndex={currentFlashcardIndex}
                onSetCurrentIndex={setCurrentFlashcardIndex}
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