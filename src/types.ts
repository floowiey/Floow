
export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  darkMode?: boolean;
}

export interface Task {
  id: string;
  userId: string;
  name: string;
  description: string;
  timeRange?: string;
  createdAt: string;
  checks: Record<string, boolean>; // "YYYY-MM-DD": true
}

export interface Note {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  text: string;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  content: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    darkMode: boolean;
  };
}
