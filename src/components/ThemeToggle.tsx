"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check initial theme
    const prefersDark =
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(prefersDark);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.323 2.677a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zm2.646 2.646a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM15 11a1 1 0 100-2h-1a1 1 0 100 2h1zm2.071-7.071a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM5 11a1 1 0 100-2H4a1 1 0 100 2h1zm-.929 7.071a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 1.414a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707zM10 18a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.323-2.677a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm-2.646-2.646a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}
