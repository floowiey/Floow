
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { format, isSameDay } from 'date-fns';
import { motion } from 'motion/react';
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
  Trash2
} from 'lucide-react';

export default function Diary() {
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date());
  const [isPreview, setIsPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useApp();

  useEffect(() => {
    fetchDiary();
  }, [date]);

  const fetchDiary = async () => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/diary/${dateKey}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setContent(data.content || '');
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
    chars: content.length
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar - Date Selection & Stats */}
      <div className="space-y-6">
        <div className="glass-card p-6">
           <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <CalendarIcon size={20} />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Entry Date</div>
                <div className="text-xl font-serif font-black italic">{format(date, 'MMM d, yyyy')}</div>
              </div>
           </div>

           <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center text-white/60">
                <span>Words</span>
                <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-white">{stats.words}</span>
              </div>
              <div className="flex justify-between items-center text-white/60">
                <span>Characters</span>
                <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-white">{stats.chars}</span>
              </div>
              <div className="flex justify-between items-center text-white/60">
                <span>Created By</span>
                <span className="text-white">@{user?.username}</span>
              </div>
           </div>
        </div>

        <div className="glass-card p-6 bg-white/[0.02]">
           <h3 className="text-xs uppercase font-bold text-white/30 tracking-widest mb-4">Writing Tips</h3>
           <ul className="space-y-3 text-xs text-white/40 leading-relaxed italic">
             <li>• Reflect on your wins today.</li>
             <li>• What is one thing you'd change?</li>
             <li>• List things you're grateful for.</li>
             <li>• Focus on feelings, not just facts.</li>
           </ul>
        </div>
      </div>

      {/* Main Journal Editor */}
      <div className="lg:col-span-3">
        <div className="glass h-full min-h-[600px] flex flex-col overflow-hidden relative border-white/5">
          {/* Toolbar */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
             <div className="flex items-center gap-2">
                <button 
                   onClick={() => setIsPreview(!isPreview)}
                   className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isPreview ? 'bg-white text-black' : 'hover:bg-white/10 text-white/60'}`}
                >
                  {isPreview ? <><Edit3 size={16} /> Edit</> : <><Eye size={16} /> Preview</>}
                </button>
             </div>

             <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 border-r border-white/10 pr-4">
                  <button onClick={() => insertText('**', '**')} className="p-2 hover:bg-white/10 rounded transition-all text-white/40 hover:text-white" title="Bold">
                    <Bold size={18} />
                  </button>
                  <button onClick={() => insertText('*', '*')} className="p-2 hover:bg-white/10 rounded transition-all text-white/40 hover:text-white" title="Italic">
                    <Italic size={18} />
                  </button>
                  <button onClick={() => insertText('- ')} className="p-2 hover:bg-white/10 rounded transition-all text-white/40 hover:text-white" title="List">
                    <List size={18} />
                  </button>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary py-2 px-6 text-sm flex items-center gap-2 shadow-xl shadow-white/5"
                >
                  {saving ? 'Saving...' : <><Save size={16} /> Save</>}
                </button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-12 bg-white/[0.01]">
            {isPreview ? (
              <div className="prose prose-invert prose-lg max-w-none prose-p:leading-relaxed prose-headings:font-serif prose-headings:italic prose-headings:font-black pb-20">
                <div className="markdown-body">
                  <Markdown>{content || '*No content for this entry yet.*'}</Markdown>
                </div>
              </div>
            ) : (
              <textarea 
                className="w-full h-full bg-transparent border-none focus:outline-none resize-none text-xl leading-relaxed placeholder:text-white/10 pb-20 font-sans"
                placeholder="Start writing your thoughts..."
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            )}
          </div>

          <div className="absolute bottom-6 left-6 flex items-center gap-2 text-white/20 select-none">
             <Clock size={14} />
             <span className="text-[10px] uppercase font-bold tracking-widest leading-none">Auto-saving enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
