
import React, { useState, useMemo } from 'react';
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
import { ChevronLeft, ChevronRight, X, StickyNote } from 'lucide-react';

export default function Calendar() {
  const { tasks, toggleTask } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState<string>('');

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
    fetchNote(day);
  };

  const fetchNote = async (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/notes/${dateKey}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setNotes(data.text);
    }
  };

  const saveNote = async () => {
    if (!selectedDay) return;
    const dateKey = format(selectedDay, 'yyyy-MM-dd');
    const token = localStorage.getItem('token');
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ date: dateKey, text: notes })
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif font-black italic">
               {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="btn-secondary p-2 rounded-full"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="btn-secondary p-2 rounded-full"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="p-4 text-center text-[10px] uppercase tracking-widest text-white/30 font-bold bg-white/[0.02]">
                {d}
              </div>
            ))}
            {calendarDays.map(day => {
              const { percentage, completed } = getDayStats(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const isToday = isSameDay(day, new Date());
              const currentMonthOnly = day.getMonth() === currentMonth.getMonth();

              return (
                <div 
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`relative h-24 md:h-32 p-2 transition-all cursor-pointer group
                    ${currentMonthOnly ? 'bg-white/[0.03]' : 'bg-transparent grayscale opacity-20'}
                    ${isSelected ? 'ring-2 ring-inset ring-white z-10' : 'hover:bg-white/10'}
                  `}
                >
                  <div className={`text-sm font-bold mb-2 ${isToday ? 'bg-blue-500 w-6 h-6 flex items-center justify-center rounded-full shadow-lg shadow-blue-500/40' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  
                  {percentage > 0 && (
                    <div className="absolute bottom-4 left-2 right-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-white/40">
                         <span>{completed} done</span>
                         <span>{percentage}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          className={`h-full rounded-full ${
                            percentage === 100 ? 'bg-green-400' : percentage > 50 ? 'bg-blue-400' : 'bg-orange-400'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Details Side-pane */}
      <AnimatePresence mode="wait">
        {selectedDay && (
          <motion.div 
            key={selectedDay.toISOString()}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="glass-card p-6">
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <div className="text-xs uppercase tracking-widest text-white/30 font-bold">Details for</div>
                   <div className="text-xl font-serif font-black italic">{format(selectedDay, 'EEEE, d MMM')}</div>
                 </div>
                 <div className={`p-4 rounded-2xl ${getDayStats(selectedDay).percentage === 100 ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/40'} border border-white/10`}>
                   <div className="text-2xl font-black">{getDayStats(selectedDay).percentage}%</div>
                 </div>
               </div>

               <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                 <h3 className="text-[10px] uppercase font-bold text-white/20 tracking-widest border-b border-white/5 pb-2">Tracked Habits</h3>
                 {tasks.map(task => {
                   const dateKey = format(selectedDay, 'yyyy-MM-dd');
                   const isDone = task.checks[dateKey];
                   return (
                     <div 
                       key={task.id} 
                       onClick={() => toggleTask(task.id, dateKey, !isDone)}
                       className={`p-4 rounded-xl border border-white/5 transition-all cursor-pointer flex items-center justify-between
                        ${isDone ? 'bg-green-400/10 border-green-400/20' : 'bg-white/[0.02] hover:bg-white/5'}
                       `}
                     >
                       <span className={`text-sm ${isDone ? 'text-green-400 font-bold' : 'text-white/60'}`}>{task.name}</span>
                       {isDone && <CheckIcon size={16} />}
                     </div>
                   );
                 })}
               </div>

               <div className="mt-8 space-y-4 pt-6 border-t border-white/10">
                 <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-white/20 tracking-widest">
                   <StickyNote size={12} /> Day Notes
                 </div>
                 <textarea 
                   className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-mono"
                   placeholder="Reflections on this day..."
                   value={notes}
                   onChange={e => setNotes(e.target.value)}
                   onBlur={saveNote}
                 />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
