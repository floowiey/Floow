
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Task, Note, DiaryEntry } from '../types';

interface AppContextType {
  user: User | null;
  tasks: Task[];
  loading: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
  fetchTasks: () => Promise<void>;
  toggleTask: (taskId: string, date: string, completed: boolean) => Promise<void>;
  updateDarkMode: (enabled: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      fetchTasks();
    }
    setLoading(false);
  }, []);

  const login = (token: string, userData: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    fetchTasks();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setTasks([]);
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    }
  };

  const toggleTask = async (taskId: string, date: string, completed: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tasks/${taskId}/toggle`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, completed })
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, checks: { ...t.checks, [date]: completed } } : t));
      }
    } catch (error) {
      console.error('Failed to toggle task', error);
    }
  };

  const updateDarkMode = async (enabled: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/settings/darkMode', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ darkMode: enabled })
      });
      setUser(prev => prev ? { ...prev, darkMode: enabled } : null);
      if (user) {
        const updatedUser = { ...user, darkMode: enabled };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to update dark mode', error);
    }
  };

  return (
    <AppContext.Provider value={{ user, tasks, loading, login, logout, fetchTasks, toggleTask, updateDarkMode }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
