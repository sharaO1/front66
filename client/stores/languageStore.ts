import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "../lib/i18n";

interface LanguageState {
  language: "en" | "ru" | "tg";
  activeUserId: string | null;
  setLanguage: (language: "en" | "ru" | "tg") => void;
  setUserId: (userId: string | null) => void;
  restoreForUser: (userId: string) => void;
}

function detectDeviceLanguage(): "en" | "ru" | "tg" {
  if (typeof navigator === "undefined") return "ru";
  const langs = (navigator.languages || [navigator.language]).map((l) =>
    l.toLowerCase(),
  );
  for (const l of langs) {
    if (l.startsWith("ru")) return "ru";
    if (l.startsWith("en")) return "en";
    if (l.startsWith("tg") || l.startsWith("tj")) return "tg";
  }
  return "ru";
}

const initial = detectDeviceLanguage();

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: initial,
      activeUserId: null,
      setLanguage: (language) => {
        set({ language });
        i18n.changeLanguage(language);
        const userId = get().activeUserId;
        if (userId) localStorage.setItem(`language-preference:${userId}`, language);
      },
      setUserId: (activeUserId) => set({ activeUserId }),
      restoreForUser: (userId) => {
        const savedLanguage = localStorage.getItem(`language-preference:${userId}`);
        const language =
          savedLanguage === "en" || savedLanguage === "tg" || savedLanguage === "ru"
            ? savedLanguage
            : initial;
        set({ activeUserId: userId });
        get().setLanguage(language);
      },
    }),
    {
      name: "language-storage",
      partialize: (state) => ({ language: state.language }),
    },
  ),
);

// Ensure i18n reflects detected language on startup
i18n.changeLanguage(useLanguageStore.getState().language);
