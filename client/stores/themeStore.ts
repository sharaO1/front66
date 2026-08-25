import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  activeUserId: string | null;
  setTheme: (theme: 'light' | 'dark') => void;
  setUserId: (userId: string | null) => void;
  restoreForUser: (userId: string) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      activeUserId: null,
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
        const userId = get().activeUserId;
        if (userId) localStorage.setItem(`theme-preference:${userId}`, theme);
      },
      setUserId: (activeUserId) => set({ activeUserId }),
      restoreForUser: (userId) => {
        const savedTheme = localStorage.getItem(`theme-preference:${userId}`);
        const theme = savedTheme === 'dark' ? 'dark' : 'light';
        set({ activeUserId: userId });
        get().setTheme(theme);
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
