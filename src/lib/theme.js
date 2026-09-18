import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('kora.theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kora.theme', theme);
  }, [theme]);
  const toggle = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), []);
  return [theme, toggle];
}

export function useLocalState(key, initial) {
  const [v, setV] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw === null ? initial : JSON.parse(raw); }
    catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, setV];
}
