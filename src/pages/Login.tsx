
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="atmosphere" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card max-w-md w-full p-8 md:p-12 relative overflow-hidden"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-6 transform -rotate-6 shadow-2xl">
            <span className="text-black font-black text-3xl italic">F</span>
          </div>
          <h1 className="text-3xl font-serif italic font-black mb-2">Welcome Back</h1>
          <p className="text-white/40">Enter your credentials to access Floow</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40 ml-1">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-field w-full pl-12" 
                placeholder="habittracker"
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field w-full pl-12" 
                placeholder="••••••••"
                required 
              />
            </div>
          </div>

          {error && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 group"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Login <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </form>

        <p className="text-center mt-8 text-white/40 text-sm">
          Don't have an account? <Link to="/signup" className="text-white hover:underline transition-all">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}

function UserIcon(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
