
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  BarChart3, 
  BookText, 
  LogOut, 
  Moon, 
  Sun, 
  Clock,
  Download,
  User as UserIcon,
  Plus,
  FileJson
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, tasks, logout, updateDarkMode } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const exportCSV = () => {
    let csv = 'Task,Date,Completed\n';
    tasks.forEach(task => {
       Object.entries(task.checks).forEach(([date, done]) => {
          if (done) {
             csv += `"${task.name}",${date},${done}\n`;
          }
       });
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `floow_data_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportJSON = () => {
    const data = {
      user: { id: user?.id, username: user?.username },
      tasks: tasks,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `floow_data_${format(new Date(), 'yyyy-MM-dd')}.json`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!user) return <>{children}</>;

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Calendar', icon: CalendarIcon, path: '/calendar' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics' },
    { name: 'Diary', icon: BookText, path: '/diary' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 glass m-4 flex flex-col p-4 z-10 transition-all duration-500 shadow-2xl shadow-indigo-100">
        <div className="flex items-center gap-3 px-2 mb-10 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/30">
            <span className="text-white font-black text-xl italic uppercase">f</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-indigo-950 uppercase hidden md:block">Floow</span>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                location.pathname === item.path 
                  ? 'bg-white text-indigo-600 shadow-sm font-semibold' 
                  : 'text-slate-500 hover:bg-white/50 hover:text-indigo-600'
              }`}
            >
              <item.icon size={22} className={location.pathname === item.path ? 'text-indigo-600' : ''} />
              <span className="hidden md:block">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="pt-4 mt-4 border-t border-slate-200/50 space-y-2">
          <button 
            onClick={() => updateDarkMode(!user.darkMode)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl text-slate-500 hover:bg-white/50 hover:text-indigo-600 transition-all"
          >
            {user.darkMode ? <Sun size={22} /> : <Moon size={22} />}
            <span className="font-medium hidden md:block">Theme</span>
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 p-3 rounded-2xl text-rose-500 hover:bg-rose-50/50 transition-all text-left"
          >
            <LogOut size={22} />
            <span className="font-medium hidden md:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top bar */}
        <header className="h-20 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-6">
             <div className="hidden lg:flex items-center gap-2 text-slate-400">
                <Clock size={16} />
                <span className="text-sm font-mono font-medium tracking-widest text-slate-600">
                  {format(currentTime, 'HH:mm:ss')}
                </span>
             </div>
             <div className="text-slate-400 text-xs font-bold uppercase tracking-widest hidden sm:block">
               {format(currentTime, 'MMMM yyyy')}
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1 bg-slate-200/40 p-1 rounded-2xl border border-white/60">
                <button 
                  onClick={exportCSV}
                  className="p-2 hover:bg-white rounded-xl transition-all text-slate-500 hover:text-indigo-600 group flex items-center gap-2"
                  title="Export CSV"
                >
                  <Download size={18} />
                  <span className="text-[10px] font-bold uppercase hidden xl:block tracking-widest">CSV</span>
                </button>
                <button 
                  onClick={exportJSON}
                  className="p-2 hover:bg-white rounded-xl transition-all text-slate-500 hover:text-indigo-600 group flex items-center gap-2"
                  title="Export JSON"
                >
                  <FileJson size={18} />
                  <span className="text-[10px] font-bold uppercase hidden xl:block tracking-widest">JSON</span>
                </button>
             </div>
             
             <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
               <div className="text-right hidden sm:block">
                 <div className="text-sm font-bold text-slate-800 tracking-tight">{user.username}</div>
                 <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Member</div>
               </div>
               <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center overflow-hidden shadow-sm">
                 <UserIcon size={20} className="text-indigo-400" />
               </div>
             </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </section>
      </main>
    </div>
  );
}
