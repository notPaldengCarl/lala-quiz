
import React, { useState, useRef, useEffect } from 'react';
import { QuizSettings, Difficulty, QuestionType, ScoringType, FileData, UserStats, QuizSession } from '../types';
import { MAX_QUESTIONS_LIMIT, MIN_QUESTIONS_LIMIT, DAILY_QUOTES } from '../constants';
import Button from './Button';

interface InputSectionProps {
  settings: QuizSettings;
  onSettingsChange: (settings: QuizSettings) => void;
  onGenerate: (text: string, files: FileData[]) => void;
  isLoading: boolean;
  userStats: UserStats;
  history: QuizSession[];
  onLoadSession: (session: QuizSession) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onShareSession: (session: QuizSession) => void;
}

const InputSection: React.FC<InputSectionProps> = ({ 
  settings, 
  onSettingsChange, 
  onGenerate,
  isLoading,
  userStats,
  history,
  onLoadSession,
  onDeleteSession,
  onRenameSession,
  onShareSession
}) => {
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState<FileData[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');
  const [randomQuote, setRandomQuote] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRandomQuote(DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: FileData[] = [];
      Array.from(e.target.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const result = event.target.result as string;
            const base64Data = result.split(',')[1];
            newFiles.push({
              name: file.name,
              mimeType: file.type,
              data: base64Data
            });
            if (newFiles.length === e.target.files!.length) {
              setFiles(prev => [...prev, ...newFiles]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSettingChange = <K extends keyof QuizSettings>(key: K, value: QuizSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const toggleQuestionType = (type: QuestionType) => {
    const current = settings.questionTypes;
    if (current.includes(type)) {
      if (current.length > 1) { 
        handleSettingChange('questionTypes', current.filter(t => t !== type));
      }
    } else {
      handleSettingChange('questionTypes', [...current, type]);
    }
  };

  const startEditing = (session: QuizSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitleText(session.title);
    setTimeout(() => editInputRef.current?.focus(), 10);
  };

  const saveTitle = () => {
    if (editingSessionId && editTitleText.trim()) {
      onRenameSession(editingSessionId, editTitleText.trim());
    }
    setEditingSessionId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveTitle();
    if (e.key === 'Escape') setEditingSessionId(null);
  };

  const canGenerate = inputText.trim().length > 0 || files.length > 0;

  return (
    <div className="max-w-7xl mx-auto w-full animate-fade-in-up pb-12">
      
      {/* Hero Section */}
      <div className="text-center mb-8 md:mb-10 px-4">
         <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[6rem] leading-none font-black text-[#544230] tracking-tighter drop-shadow-sm uppercase">
           LALA<span className="text-[#A08267]">QUIZ</span>
         </h1>
         <p className="mt-4 text-base md:text-lg font-medium text-[#79614B] max-w-xl mx-auto italic">
            "{randomQuote}"
         </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-0 md:px-0">
        
        {/* Left: Input & Creation Area */}
        <div className="lg:col-span-8 space-y-6">
           <div className="earth-card p-1 bg-white">
              <div className="p-4 border-b-2 border-[#544230] flex justify-between items-center bg-[#544230] rounded-t-[20px]">
                 <div className="flex items-center gap-2 text-[#F5F1E8]">
                    <i className="fas fa-layer-group"></i>
                    <span className="font-bold uppercase tracking-wider text-xs md:text-sm">Source Material</span>
                 </div>
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="text-[10px] md:text-xs font-bold text-[#544230] bg-[#F5F1E8] px-3 py-2 rounded-lg hover:bg-white transition-colors uppercase flex items-center gap-2"
                 >
                   <i className="fas fa-plus"></i> Add Content
                 </button>
                 <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.pdf,.md,.csv,.jpg,.jpeg,.png,.webp" multiple onChange={handleFileChange} />
              </div>
              
              <textarea
                className="w-full h-48 md:h-64 p-4 md:p-6 focus:outline-none text-[#544230] placeholder-[#A08267]/50 resize-none text-base md:text-lg bg-[#F5F1E8] rounded-b-[20px]"
                placeholder="Paste text or upload images/PDFs to generate questions..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />

              {files.length > 0 && (
                <div className="p-4 bg-white border-t-2 border-[#544230]/10 flex flex-wrap gap-3 rounded-b-[20px]">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[#F5F1E8] border border-[#C9A585] px-3 py-2 rounded-lg text-sm font-bold text-[#544230] max-w-full">
                      {file.mimeType.startsWith('image/') ? (
                         <div className="w-8 h-8 rounded bg-white overflow-hidden border border-[#C9A585] flex-shrink-0">
                             <img src={`data:${file.mimeType};base64,${file.data}`} alt="preview" className="w-full h-full object-cover" />
                         </div>
                      ) : (
                         <i className="fas fa-file-alt text-[#A08267] text-lg flex-shrink-0"></i>
                      )}
                      <span className="truncate max-w-[120px] md:max-w-[150px]">{file.name}</span>
                      <button onClick={() => removeFile(idx)} className="hover:text-red-500 ml-2 flex-shrink-0"><i className="fas fa-times"></i></button>
                    </div>
                  ))}
                </div>
              )}
           </div>
            
           {/* Configuration */}
           <div className="earth-card p-6 md:p-8 bg-white">
              <div className="flex items-center gap-2 mb-6">
                 <i className="fas fa-sliders-h text-[#A08267]"></i>
                 <h3 className="text-lg font-bold uppercase text-[#544230]">Quiz Configuration</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Questions Count */}
                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-xs font-bold uppercase text-[#79614B]">Total Questions</label>
                       <span className="text-xl font-black text-[#544230]">{settings.numberOfQuestions}</span>
                    </div>
                    <input 
                       type="range" 
                       min={MIN_QUESTIONS_LIMIT} 
                       max={MAX_QUESTIONS_LIMIT}
                       value={settings.numberOfQuestions}
                       onChange={(e) => handleSettingChange('numberOfQuestions', parseInt(e.target.value))}
                       className="w-full h-3 bg-[#F5F1E8] rounded-full appearance-none cursor-pointer accent-[#544230] border border-[#C9A585]"
                    />
                    <div className="flex justify-between text-[10px] text-[#A08267] font-bold mt-1">
                       <span>1</span>
                       <span>200</span>
                    </div>
                 </div>
                 
                 {/* Difficulty */}
                 <div>
                    <label className="text-xs font-bold uppercase text-[#79614B] mb-2 block">Difficulty Level</label>
                    <div className="flex gap-2">
                       {Object.values(Difficulty).map(d => (
                          <button
                            key={d}
                            onClick={() => handleSettingChange('difficulty', d)}
                            className={`flex-1 py-2 text-[10px] md:text-xs font-bold uppercase border-2 rounded-lg transition-all ${
                               settings.difficulty === d 
                               ? 'bg-[#544230] text-[#F5F1E8] border-[#544230]' 
                               : 'bg-white border-[#C9A585] text-[#79614B] hover:border-[#544230]'
                            }`}
                          >
                            {d}
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Question Types Toggle */}
                 <div className="md:col-span-2">
                     <label className="text-xs font-bold uppercase text-[#79614B] mb-3 block">Included Question Types</label>
                     <div className="flex flex-wrap gap-3">
                        {Object.values(QuestionType).map(type => (
                           <button
                              key={type}
                              onClick={() => toggleQuestionType(type)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-xs md:text-sm font-bold transition-all uppercase ${
                                 settings.questionTypes.includes(type)
                                 ? 'bg-[#A08267] border-[#A08267] text-white shadow-sm'
                                 : 'bg-white border-[#C9A585] text-[#79614B] hover:border-[#A08267]'
                              }`}
                           >
                              {settings.questionTypes.includes(type) && <i className="fas fa-check text-xs"></i>}
                              {type === QuestionType.TrueFalse ? 'TRUE / FALSE' : type.replace(/_/g, ' ').toUpperCase()}
                           </button>
                        ))}
                     </div>
                 </div>
              </div>

              <div className="mt-8 pt-6 border-t-2 border-[#544230]/10">
                 <Button 
                   className="w-full py-4 text-lg" 
                   onClick={() => onGenerate(inputText, files)}
                   isLoading={isLoading}
                   disabled={!canGenerate}
                   icon={<i className="fas fa-magic"></i>}
                 >
                   GENERATE STUDY SET
                 </Button>
              </div>
           </div>
        </div>

        {/* Right: History & Stats */}
        <div className="lg:col-span-4 space-y-6">
           
           {/* Stats Card */}
           <div className="earth-card p-6 bg-[#544230] text-[#F5F1E8] border-none">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-bold uppercase tracking-wider text-sm opacity-80">Profile Stats</h3>
                 <i className="fas fa-chart-pie opacity-50"></i>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[#79614B]/30 p-4 rounded-2xl border border-[#79614B]/50">
                    <div className="text-[10px] font-bold uppercase opacity-70 mb-1">Level</div>
                    <div className="text-4xl font-black">{userStats.level}</div>
                 </div>
                 <div className="bg-[#79614B]/30 p-4 rounded-2xl border border-[#79614B]/50">
                    <div className="text-[10px] font-bold uppercase opacity-70 mb-1">Total XP</div>
                    <div className="text-4xl font-black">{userStats.xp}</div>
                 </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#79614B]/50 flex justify-between items-center">
                 <span className="text-xs font-bold opacity-70">Questions Answered</span>
                 <span className="text-lg font-bold">{userStats.questionsAnswered}</span>
              </div>
           </div>

           {/* History List */}
           <div className="earth-card bg-white overflow-hidden flex flex-col h-[400px] md:h-[600px]">
              <div className="p-5 border-b-2 border-[#544230]/10 bg-[#F5F1E8]">
                 <h3 className="font-bold uppercase text-[#544230] flex items-center gap-2">
                    <i className="fas fa-history"></i> Session History
                 </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                 {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#A08267] opacity-60">
                       <i className="fas fa-book-open text-4xl mb-2"></i>
                       <span className="text-sm font-bold">No sessions yet</span>
                    </div>
                 ) : (
                    history.map((session) => (
                       <div 
                         key={session.id} 
                         onClick={() => onLoadSession(session)}
                         className="group relative bg-white border border-[#C9A585] hover:border-[#544230] rounded-xl p-3 transition-all cursor-pointer hover:shadow-md"
                       >
                          {editingSessionId === session.id ? (
                             <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <input 
                                   ref={editInputRef}
                                   type="text" 
                                   value={editTitleText}
                                   onChange={(e) => setEditTitleText(e.target.value)}
                                   onBlur={saveTitle}
                                   onKeyDown={handleKeyDown}
                                   className="flex-1 text-sm font-bold text-[#544230] bg-[#F5F1E8] px-2 py-1 rounded border border-[#A08267] outline-none"
                                />
                                <button onClick={saveTitle} className="text-[#544230] hover:text-[#A08267]"><i className="fas fa-check"></i></button>
                             </div>
                          ) : (
                             <div className="flex justify-between items-start">
                                <div className="font-bold text-[#544230] truncate pr-8 text-sm">{session.title}</div>
                                <div className="flex items-center gap-2 absolute top-3 right-3 z-10">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); onShareSession(session); }}
                                      className="text-[#A08267] opacity-50 hover:opacity-100 hover:text-[#544230] text-xs p-1"
                                      title="Share Quiz Link"
                                    >
                                      <i className="fas fa-share-alt"></i>
                                    </button>
                                    <button 
                                      onClick={(e) => startEditing(session, e)}
                                      className="text-[#A08267] opacity-50 hover:opacity-100 hover:text-[#544230] text-xs p-1"
                                      title="Rename"
                                    >
                                      <i className="fas fa-pen"></i>
                                    </button>
                                </div>
                             </div>
                          )}
                          
                          <div className="flex justify-between items-center mt-2">
                             <div className="text-[10px] font-bold text-[#79614B] opacity-60">
                                {new Date(session.timestamp).toLocaleDateString()}
                             </div>
                             <div className="text-[10px] font-black bg-[#A08267]/10 text-[#A08267] px-2 py-0.5 rounded border border-[#A08267]/20">
                                {session.data.questions.length} Qs
                             </div>
                          </div>
                          
                          <button 
                             onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                             className="absolute bottom-2 right-2 w-6 h-6 flex items-center justify-center text-[#A08267] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all hover:bg-red-50 rounded-full"
                             title="Delete"
                          >
                             <i className="fas fa-trash-alt text-xs"></i>
                          </button>
                       </div>
                    ))
                 )}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default InputSection;