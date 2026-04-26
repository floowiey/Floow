
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { format, isSameDay, subDays, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  Type, 
  Bold, 
  Italic, 
  List, 
  Save, 
  Calendar as CalendarIcon, 
  Eye, 
  Edit3,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles
} from 'lucide-react';

export default function Diary() {
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date());
  const [isPreview, setIsPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { user } = useApp();

  useEffect(() => {
    fetchDiary();
  }, [date]);

  const fetchDiary = async () => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/diary/${dateKey}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const dateKey = format(date, 'yyyy-MM-dd');
    const token = localStorage.getItem('token');
    try {
      await fetch('/api/diary', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date: dateKey, content })
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content;
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + before + selected + after + text.substring(end);
    
    setContent(newText);
    textarea.focus();
  };

  const stats = {
    words: content.trim() ? content.trim().split(/\s+/).length : 0,
    chars: content.length,
    readingTime: Math.ceil(content.trim().split(/\s+/).length / 200)
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 dark:shadow-none">
              <BookOpen size={24} />
           </div>
           <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Mindful Diary</h2>
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Capture your journey, one thought at a time.</p>
           </div>
        </div>

        <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
           <button 
             onClick={() => setDate(subDays(date, 1))}
             className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 dark:text-slate-400"
           >
             <ChevronLeft size={20} />
           </button>
           <div className="px-4 font-bold text-slate-700 dark:text-slate-200 min-w-[140px] text-center flex items-center gap-2">
             <CalendarIcon size={14} className="text-indigo-500" />
             {format(date, 'MMM d, yyyy')}
           </div>
           <button 
             onClick={() => setDate(addDays(date, 1))}
             className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 dark:text-slate-400"
           >
             <ChevronRight size={20} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Context & Stats */}
        <div className="space-y-6">
          <div className="glass-card p-8">
             <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">Entry Metadata</div>
             
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} /> <span className="text-xs font-bold">Reading Time</span>
                   </div>
                   <span className="text-xs font-black text-slate-800 dark:text-white uppercase">{stats.readingTime} min</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-slate-400">
                      <Type size={14} /> <span className="text-xs font-bold">Word Count</span>
                   </div>
                   <span className="text-xs font-black text-slate-800 dark:text-white uppercase">{stats.words}</span>
                </div>
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                   <div className="text-[10px] font-black text-slate-300 dark:text-600 uppercase tracking-widest mb-2">Author Profile</div>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase">
                        {user?.username[0]}
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">@{user?.username}</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="glass-card p-8 bg-indigo-600 dark:bg-indigo-900/40 border-transparent text-white">
             <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-indigo-200" />
                <h3 className="text-xs uppercase font-black tracking-widest">Writing Spark</h3>
             </div>
             <p className="text-sm font-medium italic text-indigo-100 leading-relaxed mb-4">
                "What made you smile today? Even if it's something small, capturing it grounds your gratitude."
             </p>
             <div className="h-1 w-full bg-indigo-500/30 rounded-full overflow-hidden">
                <motion.div animate={{x: ['-100%', '100%']}} transition={{repeat: Infinity, duration: 4}} className="h-full w-1/3 bg-white/20" />
             </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-3">
           <div className="glass-card h-full min-h-[650px] flex flex-col overflow-hidden relative border-white/60 dark:border-white/5 shadow-2xl">
              {/* Editor Bar */}
              <div className="p-6 border-b border-white/20 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
                 <div className="flex items-center gap-3">
                    <button 
                       onClick={() => setIsPreview(!isPreview)}
                       className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isPreview ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                      {isPreview ? <><Edit3 size={14} /> Write</> : <><Eye size={14} /> Preview</>}
                    </button>
                    
                    {!isPreview && (
                      <div className="flex items-center gap-1.5 ml-4 border-l border-slate-200 dark:border-slate-800 pl-4">
                         <button onClick={() => insertText('**', '**')} className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors">
                           <Bold size={16} />
                         </button>
                         <button onClick={() => insertText('*', '*')} className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors">
                           <Italic size={16} />
                         </button>
                         <button onClick={() => insertText('- ')} className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors">
                           <List size={16} />
                         </button>
                      </div>
                    )}
                 </div>

                 <div className="flex items-center gap-4">
                    {lastSaved && (
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hidden sm:block">
                        Entry Archived {format(lastSaved, 'HH:mm')}
                      </span>
                    )}
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary py-2.5 px-8 text-xs font-black uppercase tracking-widest flex items-center gap-2"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : <><Save size={14} /> Commit Entry</>}
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-transparent">
                <AnimatePresence mode="wait">
                  {isPreview ? (
                    <motion.div 
                      key="preview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="prose dark:prose-invert prose-slate max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed prose-lg"
                    >
                      <div className="markdown-body">
                         <Markdown>{content || '*The canvas is empty. Start your journey in the editor.*'}</Markdown>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="editor"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full"
                    >
                      <textarea 
                        className="w-full h-full bg-transparent border-none focus:outline-none resize-none text-lg md:text-xl leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                        placeholder="Pour your consciousness onto the canvas..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="absolute bottom-8 right-12 flex items-center gap-2 text-slate-300 dark:text-slate-700 pointer-events-none select-none">
                 <Sparkles size={14} />
                 <span className="text-[10px] uppercase font-black tracking-widest">Mindful Flow State</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
