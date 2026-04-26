import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isFuture, 
  addMonths,
  subMonths,
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Plus, 
  TrendingUp, 
  Target,
  Trophy,
  Edit2,
  Trash2,
  Settings2,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { Task } from '../types';

const TASK_COLORS = [
  { bg: 'bg-indigo-500', border: 'border-indigo-100', shadow: 'shadow-indigo-500/20' },
  { bg: 'bg-emerald-500', border: 'border-emerald-100', shadow: 'shadow-emerald-500/20' },
  { bg: 'bg-rose-500', border: 'border-rose-100', shadow: 'shadow-rose-500/20' },
  { bg: 'bg-amber-500', border: 'border-amber-100', shadow: 'shadow-amber-500/20' },
  { bg: 'bg-blue-500', border: 'border-blue-100', shadow: 'shadow-blue-500/20' },
  { bg: 'bg-purple-500', border: 'border-purple-100', shadow: 'shadow-purple-500/20' },
];

export default function Dashboard() {
  const { tasks, toggleTask, fetchTasks } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    timeRange: '',
    description: ''
  });

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
  }, [currentMonth]);

  const stats = useMemo(() => {
    const totalPossible = tasks.length * daysInMonth.length;
    let completedCount = 0;
    tasks.forEach(task => {
      daysInMonth.forEach(day => {
        if (task.checks[format(day, 'yyyy-MM-dd')]) completedCount++;
      });
    });
    const completionRate = totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0;
    let perfectDays = 0;
    daysInMonth.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      if (tasks.length > 0 && tasks.every(t => t.checks[dateKey])) perfectDays++;
    });
    return { completionRate, perfectDays, totalTasks: tasks.length };
  }, [tasks, daysInMonth]);

  const handleToggle = (taskId: string, day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    if (isFuture(day)) return;
    const task = tasks.find(t => t.id === taskId);
    const isCompleted = task?.checks[dateKey] || false;
    toggleTask(taskId, dateKey, !isCompleted);
  };

  const handleOpenAdd = () => {
    setEditingTask(null);
    setFormData({ name: '', timeRange: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({ 
      name: task.name, 
      timeRange: task.timeRange || '', 
      description: task.description || '' 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
    const method = editingTask ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      await fetchTasks();
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchTasks();
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-card w-full max-w-lg p-10 relative z-10 border-white dark:border-slate-800"
            >
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    {editingTask ? <Settings2 size={24} /> : <Target size={24} />}
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                        {editingTask ? 'Edit Goal' : 'New Goal'}
                    </h2>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Define your productivity boundaries</p>
                 </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest ml-1">Goal Name</label>
                   <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="input-field w-full" 
                    placeholder="e.g. Deep Work Session"
                    required 
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest ml-1">Timing</label>
                       <div className="relative">
                          <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
                          <input 
                            type="text" 
                            value={formData.timeRange}
                            onChange={e => setFormData({...formData, timeRange: e.target.value})}
                            className="input-field w-full pl-10" 
                            placeholder="09:00 - 13:00"
                          />
                       </div>
                    </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest ml-1">Description</label>
                   <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="input-field w-full h-24 resize-none" 
                    placeholder="Add some context or rules for this habit..."
                   />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingTask ? 'Update Goal' : 'Create Goal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 flex items-center gap-6">
          <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
            <TrendingUp size={28} />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Completion</div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white tracking-tighter">{stats.completionRate}%</div>
          </div>
        </div>
        <div className="glass-card p-8 flex items-center gap-6">
          <div className="w-14 h-14 rounded-3xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
            <Trophy size={28} />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Perfect Days</div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white tracking-tighter">{stats.perfectDays}</div>
          </div>
        </div>
        <div className="glass-card p-8 flex items-center gap-6">
          <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
            <Target size={28} />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Active Goals</div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white tracking-tighter">{stats.totalTasks}</div>
          </div>
        </div>
      </div>

      {/* Grid Controller */}
      <div className="glass-card bg-white/80 dark:bg-slate-900/60 border-white/90 dark:border-slate-800/80 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <LayoutGrid size={20} />
               </div>
               <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Habit Matrix</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Track and visualize your consistency</p>
               </div>
            </div>
            <div className="h-8 w-px bg-slate-100 dark:bg-white/10 mx-2 hidden md:block" />
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-xl transition-all text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-white"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setCurrentMonth(new Date())}
                className="px-4 py-1 text-[10px] font-black hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-xl transition-all uppercase tracking-widest text-slate-500 dark:text-slate-400"
              >
                Today
              </button>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-xl transition-all text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-white"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> New Goal
          </button>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-white/5">
                <th className="sticky left-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 text-left min-w-[240px] border-r border-slate-50 dark:border-white/5">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-300 dark:text-slate-700">Habit Name</span>
                </th>
                {daysInMonth.map(day => (
                  <th 
                    key={day.toISOString()} 
                    className={`p-3 min-w-[50px] text-center border-r border-slate-50 dark:border-white/5 ${
                      format(day, 'E') === 'Sat' || format(day, 'E') === 'Sun' ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''
                    }`}
                  >
                    <div className="text-[9px] uppercase font-black text-slate-300 dark:text-slate-700 mb-0.5">{format(day, 'EEE')}</div>
                    <div className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-1' : 'text-slate-400 dark:text-slate-600'}`}>
                      {format(day, 'd')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={daysInMonth.length + 1} className="p-32 text-center text-slate-300 dark:text-slate-700 italic font-medium">
                    No habits tracking yet. Let's start with your first goal.
                  </td>
                </tr>
              )}
              {tasks.map((task, taskIdx) => {
                const colors = TASK_COLORS[taskIdx % TASK_COLORS.length];
                return (
                  <tr key={task.id} className="border-b border-slate-50 dark:border-white/5 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="sticky left-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-4 border-r border-slate-50 dark:border-white/5">
                      <div className="flex items-center justify-between group/row">
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          <div className={`w-2 h-8 rounded-full ${colors.bg}`} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{task.name}</span>
                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">{task.timeRange || 'All Day'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0">
                          <button 
                            onClick={() => handleOpenEdit(task)}
                            className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(task.id)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </td>
                    {daysInMonth.map(day => {
                      const dateKey = format(day, 'yyyy-MM-dd');
                      const isDone = task.checks[dateKey];
                      const future = isFuture(day);
                      const isToday = isSameDay(day, new Date());
                      
                      return (
                        <td 
                          key={day.toISOString()}
                          onClick={() => handleToggle(task.id, day)}
                          className={`p-1 h-14 border-r border-slate-50 dark:border-white/5 cursor-pointer transition-all relative
                            ${future ? 'cursor-not-allowed' : 'hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20'}
                          `}
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            <AnimatePresence mode="wait">
                              {isDone ? (
                                <motion.div 
                                  key="done"
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.5, opacity: 0 }}
                                  className={`w-8 h-8 rounded-xl ${colors.bg} flex items-center justify-center shadow-lg ${colors.shadow}`}
                                >
                                  <Check size={16} className="text-white" strokeWidth={3} />
                                </motion.div>
                              ) : !future ? (
                                <div className={`w-8 h-8 rounded-xl border border-slate-100 dark:border-slate-800 transition-all ${isToday ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-900/20' : 'group-hover:border-indigo-200 dark:group-hover:border-indigo-700'}`} />
                              ) : (
                                  <div className="w-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800" />
                              )}
                            </AnimatePresence>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
