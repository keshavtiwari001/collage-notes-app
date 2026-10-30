'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('academica-theme') || 'light';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
    setMounted(true);
  }, []);

  const changeTheme = (t) => {
    setTheme(t);
    localStorage.setItem('academica-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
