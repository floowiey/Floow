
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  startOfWeek, 
  endOfWeek,
  addMonths,
  subMonths,
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X, StickyNote, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';

export default function Calendar() {
  const { tasks, toggleTask } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState<string>('');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getDayStats = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const total = tasks.length;
    const completed = tasks.filter(t => t.checks[dateKey]).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
  };

  useEffect(() => {
    if (selectedDay) {
       fetchNote(selectedDay);
    }
  }, [selectedDay]);

  const fetchNote = async (day: Date) => {
    setIsLoadingNotes(true);
    const dateKey = format(day, 'yyyy-MM-dd');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/notes/${dateKey}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.text || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const saveNote = async () => {
    if (!selectedDay) return;
    const dateKey = format(selectedDay, 'yyyy-MM-dd');
    const token = localStorage.getItem('token');
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date: dateKey, text: notes })
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Calendar View</h2>
           <p className="text-slate-500 dark:text-slate-400 font-medium">Track your historical consistency</p>
        </div>
        <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
           <button 
             onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
             className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 dark:text-slate-400"
           >
             <ChevronLeft size={20} />
           </button>
           <div className="px-4 font-bold text-slate-700 dark:text-slate-200 min-w-[140px] text-center">
             {format(currentMonth, 'MMMM yyyy')}
           </div>
           <button 
             onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
             className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 dark:text-slate-400"
           >
             <ChevronRight size={20} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-8">
          <div className="glass-card overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-4 text-center text-[10px] uppercase tracking-widest text-slate-400 font-black">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map(day => {
                const { percentage } = getDayStats(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const isToday = isSameDay(day, new Date());
                const currentMonthOnly = day.getMonth() === currentMonth.getMonth();

                return (
                  <motion.div 
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className={`relative h-24 md:h-32 p-3 border-r border-b border-slate-50 dark:border-white/5 transition-all cursor-pointer flex flex-col items-center justify-center group
                      ${currentMonthOnly ? 'bg-white/50 dark:bg-slate-900/20' : 'bg-slate-100/30 dark:bg-slate-950/40 opacity-30'}
                      ${isSelected ? 'bg-indigo-50/70 dark:bg-indigo-900/30 ring-2 ring-inset ring-indigo-500/50 z-10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'}
                    `}
                  >
                    <div className={`text-sm font-bold mb-3 ${isToday ? 'bg-indigo-600 text-white w-7 h-7 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-600/20' : 'text-slate-600 dark:text-slate-400 opacity-70 group-hover:opacity-100'}`}>
                      {format(day, 'd')}
                    </div>
                    
                    {percentage > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center max-w-[80%]">
                         {/* Visual indicator cluster */}
                         <div className={`w-2 h-2 rounded-full ${percentage === 100 ? 'bg-emerald-500' : percentage > 50 ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                         {percentage > 75 && <div className={`w-2 h-2 rounded-full ${percentage === 100 ? 'bg-emerald-400' : 'bg-indigo-400'}`} />}
                         {percentage === 100 && <div className="w-2 h-2 rounded-full bg-emerald-300" />}
                      </div>
                    )}
                    
                    {percentage > 0 && (
                      <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${percentage}%` }} />
                         </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Details Side-pane */}
        <div className="lg:col-span-4 space-y-6">
          <AnimatePresence mode="wait">
            {selectedDay ? (
              <motion.div 
                key={selectedDay.toISOString()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="glass-card p-8">
                   <div className="flex items-center justify-between mb-8">
                     <div>
                       <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Schedule Analysis</div>
                       <div className="text-2xl font-bold text-slate-800 dark:text-white">{format(selectedDay, 'EEEE, d MMM')}</div>
                     </div>
                     <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border ${getDayStats(selectedDay).percentage === 100 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'}`}>
                       <div className="text-xl font-black">{getDayStats(selectedDay).percentage}%</div>
                       <div className="text-[8px] font-black uppercase tracking-tighter">Done</div>
                     </div>
                   </div>

                   <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                     <h3 className="text-[10px] uppercase font-black text-slate-300 dark:text-slate-600 tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                        Tracked Status
                        <span className="text-indigo-500">{getDayStats(selectedDay).completed} / {getDayStats(selectedDay).total}</span>
                     </h3>
                     {tasks.map(task => {
                       const dateKey = format(selectedDay, 'yyyy-MM-dd');
                       const isDone = task.checks[dateKey];
                       return (
                         <div 
                           key={task.id} 
                           onClick={() => toggleTask(task.id, dateKey, !isDone)}
                           className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group
                            ${isDone 
                              ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50' 
                              : 'bg-white/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'}
                           `}
                         >
                           <div className="flex items-center gap-3">
                              <div className={`w-2 h-6 rounded-full ${isDone ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-slate-200 dark:bg-slate-800 group-hover:bg-indigo-300'}`} />
                              <span className={`text-sm font-bold ${isDone ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600'}`}>{task.name}</span>
                           </div>
                           {isDone && <CheckCircle2 size={16} className="text-emerald-500" />}
                         </div>
                       );
                     })}
                   </div>

                   <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
                     <div className="flex items-center gap-2 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                       <StickyNote size={14} className="text-indigo-500" /> Reflection Log
                     </div>
                     <div className="relative">
                       <textarea 
                         className="w-full h-36 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all dark:text-slate-200 placeholder:text-slate-400 font-medium"
                         placeholder="What happened today? Write down any thoughts..."
                         value={notes}
                         onChange={e => setNotes(e.target.value)}
                         onBlur={saveNote}
                         disabled={isLoadingNotes}
                       />
                       {isLoadingNotes && (
                         <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-slate-800/40 rounded-2xl">
                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                         </div>
                       )}
                     </div>
                   </div>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-12 text-center flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 h-[400px]">
                 <CalendarIcon size={48} className="mb-4 opacity-20" />
                 <p className="font-bold text-lg">Select a day to view productivity analysis</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function CheckIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}
