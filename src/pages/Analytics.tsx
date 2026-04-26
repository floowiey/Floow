import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler,
  RadialLinearScale,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { 
  format, 
  subDays, 
  eachDayOfInterval, 
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  subMonths,
  isSameDay,
  differenceInDays,
  parseISO
} from 'date-fns';
import { 
  TrendingUp, 
  Award, 
  Calendar as CalendarIcon, 
  Zap, 
  Target, 
  ArrowRight,
  Flame,
  Star,
  CheckCircle2,
  ChevronDown,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  RadialLinearScale,
  Title, 
  Tooltip, 
  Legend, 
  Filler
);

const COLORS = [
  { bg: 'bg-indigo-500', rgba: 'rgba(79, 70, 229, 0.8)', light: 'rgba(79, 70, 229, 0.1)' },
  { bg: 'bg-emerald-500', rgba: 'rgba(16, 185, 129, 0.8)', light: 'rgba(16, 185, 129, 0.1)' },
  { bg: 'bg-rose-500', rgba: 'rgba(244, 63, 94, 0.8)', light: 'rgba(244, 63, 94, 0.1)' },
  { bg: 'bg-amber-500', rgba: 'rgba(245, 158, 11, 0.8)', light: 'rgba(245, 158, 11, 0.1)' },
  { bg: 'bg-blue-500', rgba: 'rgba(59, 130, 246, 0.8)', light: 'rgba(59, 130, 246, 0.1)' },
  { bg: 'bg-purple-500', rgba: 'rgba(168, 85, 247, 0.8)', light: 'rgba(168, 85, 247, 0.1)' },
];

export default function Analytics() {
  const { tasks } = useApp();
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // Auto-select first task if none selected
  React.useEffect(() => {
    if (!selectedTaskId && tasks.length > 0) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [tasks, selectedTaskId]);

  const selectedTask = useMemo(() => tasks.find(t => t.id === selectedTaskId) || null, [tasks, selectedTaskId]);

  // --- 1. DATA CALCULATIONS ---
  const stats = useMemo(() => {
    if (!selectedTask) return null;
    
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    let completedCount = 0;
    days.forEach(day => {
      if (selectedTask.checks[format(day, 'yyyy-MM-dd')]) completedCount++;
    });

    const completionRate = days.length > 0 ? (completedCount / days.length) * 100 : 0;

    // Streak Logic (Full History)
    const allDates = Object.keys(selectedTask.checks)
      .filter(d => selectedTask.checks[d])
      .sort((a, b) => b.localeCompare(a));

    let currentStreak = 0;
    let bestStreak = 0;
    
    if (allDates.length > 0) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      
      // Current
      let cursorStr = allDates[0] === today || allDates[0] === yesterday ? allDates[0] : null;
      if (cursorStr) {
        let cursor = new Date(cursorStr);
        for (const d of allDates) {
          if (isSameDay(new Date(d), cursor)) {
            currentStreak++;
            cursor = subDays(cursor, 1);
          } else break;
        }
      }

      // Best
      const sortedAsc = [...allDates].sort((a, b) => a.localeCompare(b));
      let temp = 0;
      let prev: Date | null = null;
      sortedAsc.forEach(d => {
        const curr = new Date(d);
        if (prev && differenceInDays(curr, prev) === 1) temp++;
        else temp = 1;
        bestStreak = Math.max(bestStreak, temp);
        prev = curr;
      });
    }

    return {
      totalDays: days.length,
      completedDays: completedCount,
      completionRate,
      currentStreak,
      bestStreak,
      score: Math.round(completionRate * 0.8 + (currentStreak * 2)) // Arbitrary consistency score
    };
  }, [selectedTask]);

  // --- 2. CHART DATA ---
  
  // Daily Performance (Binary)
  const dailyPerformance = useMemo(() => {
    if (!selectedTask) return null;
    const days = eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
    return {
      labels: days.map(d => format(d, 'd')),
      datasets: [{
        label: 'Completed',
        data: days.map(d => selectedTask.checks[format(d, 'yyyy-MM-dd')] ? 100 : 0),
        borderColor: 'rgba(79, 70, 229, 1)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        stepped: true,
        pointRadius: 0
      }]
    };
  }, [selectedTask]);

  // Yearly Consistency (365 Days)
  const yearlyConsistency = useMemo(() => {
    if (!selectedTask) return null;
    const days = eachDayOfInterval({ start: startOfYear(new Date()), end: new Date() });
    
    // Group by weeks to make the 365-day line readable
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      const chunk = days.slice(i, i + 7);
      const done = chunk.filter(d => selectedTask.checks[format(d, 'yyyy-MM-dd')]).length;
      weeks.push({
        label: format(chunk[0], 'MMM d'),
        val: (done / chunk.length) * 100
      });
    }

    return {
      labels: weeks.map(w => w.label),
      datasets: [{
        label: 'Weekly Consistency',
        data: weeks.map(w => w.val),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 2
      }]
    };
  }, [selectedTask]);

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' }, ticks: { display: false } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300 mb-6">
           <Activity size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">No Data to Analyze</h2>
        <p className="text-slate-400 mt-2">Create your first goal to unlock intelligence.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-24">
      {/* TASK SELECTOR & HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Performance Deck</h2>
            <p className="text-slate-400 text-sm font-medium">Selected Task: <span className="text-indigo-600">{selectedTask?.name}</span></p>
          </div>
        </div>

        <div className="relative group min-w-[280px]">
           <select 
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full h-14 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl px-6 appearance-none font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-sm"
           >
             {tasks.map(t => (
               <option key={t.id} value={t.id}>{t.name}</option>
             ))}
           </select>
           <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
        </div>
      </div>

      {stats && selectedTask && (
        <>
          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-6 border-slate-100">
               <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Completion Rate</div>
               <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-slate-800">{Math.round(stats.completionRate)}%</span>
                  <span className="text-xs text-slate-400 font-bold mb-1.5">{stats.completedDays}/{stats.totalDays} Days</span>
               </div>
               <div className="h-1.5 w-full bg-slate-100 rounded-full mt-4 overflow-hidden">
                  <motion.div initial={{width: 0}} animate={{width: `${stats.completionRate}%`}} className="h-full bg-indigo-600 rounded-full" />
               </div>
            </div>

            <div className="glass-card p-6 border-slate-100">
               <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Current Streak</div>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                    <Flame size={20} />
                  </div>
                  <span className="text-4xl font-bold text-slate-800">{stats.currentStreak} <span className="text-xs font-black uppercase text-slate-300">Days</span></span>
               </div>
            </div>

            <div className="glass-card p-6 border-slate-100">
               <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Best Streak</div>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                    <Star size={20} />
                  </div>
                  <span className="text-4xl font-bold text-slate-800">{stats.bestStreak} <span className="text-xs font-black uppercase text-slate-300">Days</span></span>
               </div>
            </div>

            <div className="glass-card p-6 bg-indigo-600 border-transparent">
               <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Consistency Score</div>
               <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold text-white tracking-widest">{stats.score}</span>
                  <Zap size={24} className="text-white fill-white" />
               </div>
               <div className="text-[10px] text-white/40 font-bold mt-2 uppercase tracking-tight">Top 5% of users</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* DAILY PERFORMANCE */}
            <div className="glass-card p-8 lg:col-span-2">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-slate-800">Daily Performance Pattern</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</span>
                  </div>
               </div>
               <div className="h-[300px]">
                  {dailyPerformance && <Line data={dailyPerformance} options={chartOptions} />}
               </div>
            </div>

            {/* MONTHLY HEAT VIEW */}
            <div className="glass-card p-8">
               <h3 className="text-lg font-bold text-slate-800 mb-6">Monthly Heat Matrix</h3>
               <div className="grid grid-cols-7 gap-2">
                  {eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }).map(day => {
                    const isDone = selectedTask.checks[format(day, 'yyyy-MM-dd')];
                    return (
                      <motion.div 
                        key={day.toISOString()}
                        whileHover={{ scale: 1.1 }}
                        className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors
                          ${isDone ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-50 text-slate-300'}
                        `}
                        title={format(day, 'MMM d, yyyy')}
                      >
                        {format(day, 'd')}
                      </motion.div>
                    );
                  })}
               </div>
               <div className="mt-8 pt-8 border-t border-slate-100 flex items-center gap-6 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-indigo-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Success</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-slate-100" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Missed</span>
                  </div>
               </div>
            </div>
          </div>

          {/* YEARLY VIEW */}
          <div className="glass-card p-8">
             <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-xl font-bold text-slate-800 tracking-tight">365-Day Consistency Roadmap</h3>
                   <p className="text-xs text-slate-400 font-medium">Long-term behavioral transformation tracking</p>
                </div>
                <Activity size={24} className="text-emerald-500" />
             </div>
             <div className="h-[350px]">
                {yearlyConsistency && <Line data={yearlyConsistency} options={chartOptions} />}
             </div>
          </div>
        </>
      )}
    </div>
  );
}
