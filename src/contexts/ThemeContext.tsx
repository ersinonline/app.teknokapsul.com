import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'pink';

interface ThemeSettings {
  theme: Theme;
  colorScheme: ColorScheme;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
}

interface ThemeContextType {
  settings: ThemeSettings;
  updateTheme: (theme: Theme) => void;
  updateColorScheme: (scheme: ColorScheme) => void;
  updateFontSize: (size: 'small' | 'medium' | 'large') => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  isDark: boolean;
  resetToDefaults: () => void;
}

const defaultSettings: ThemeSettings = {
  theme: 'light',
  colorScheme: 'blue',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false
};

const COLOR_SCHEMES = {
  blue: {
    primary: '#3b82f6',
    primaryDark: '#1d4ed8',
    secondary: '#06b6d4',
    accent: '#8b5cf6'
  },
  green: {
    primary: '#10b981',
    primaryDark: '#047857',
    secondary: '#06b6d4',
    accent: '#f59e0b'
  },
  purple: {
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    secondary: '#06b6d4',
    accent: '#f59e0b'
  },
  orange: {
    primary: '#f97316',
    primaryDark: '#ea580c',
    secondary: '#06b6d4',
    accent: '#8b5cf6'
  },
  pink: {
    primary: '#ec4899',
    primaryDark: '#db2777',
    secondary: '#06b6d4',
    accent: '#8b5cf6'
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem('theme-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  // Determine if dark mode should be active
  const [isDark, setIsDark] = useState(() => {
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    // System preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      setIsDark(mediaQuery.matches);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setIsDark(settings.theme === 'dark');
    }
  }, [settings.theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const colors = COLOR_SCHEMES[settings.colorScheme];

    // Apply color scheme
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-dark', colors.primaryDark);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);

    // Apply dark/light theme
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply font size
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    switch (settings.fontSize) {
      case 'small':
        root.classList.add('text-sm');
        break;
      case 'medium':
        root.classList.add('text-base');
        break;
      case 'large':
        root.classList.add('text-lg');
        break;
    }

    // Apply reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Save to localStorage
    localStorage.setItem('theme-settings', JSON.stringify(settings));
  }, [settings, isDark]);

  const updateTheme = (theme: Theme) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const updateColorScheme = (colorScheme: ColorScheme) => {
    setSettings(prev => ({ ...prev, colorScheme }));
  };

  const updateFontSize = (fontSize: 'small' | 'medium' | 'large') => {
    setSettings(prev => ({ ...prev, fontSize }));
  };

  const toggleReducedMotion = () => {
    setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  const toggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('theme-settings');
  };

  const value: ThemeContextType = {
    settings,
    updateTheme,
    updateColorScheme,
    updateFontSize,
    toggleReducedMotion,
    toggleHighContrast,
    isDark,
    resetToDefaults
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme utility functions
export const getThemeColors = (colorScheme: ColorScheme) => COLOR_SCHEMES[colorScheme];

export const applyThemeToElement = (element: HTMLElement, isDark: boolean, colorScheme: ColorScheme) => {
  const colors = COLOR_SCHEMES[colorScheme];
  
  element.style.setProperty('--color-primary', colors.primary);
  element.style.setProperty('--color-primary-dark', colors.primaryDark);
  element.style.setProperty('--color-secondary', colors.secondary);
  element.style.setProperty('--color-accent', colors.accent);
  
  if (isDark) {
    element.classList.add('dark');
  } else {
    element.classList.remove('dark');
  }
};

// CSS custom properties for dynamic theming
export const getCSSVariables = (colorScheme: ColorScheme) => {
  const colors = COLOR_SCHEMES[colorScheme];
  return {
    '--color-primary': colors.primary,
    '--color-primary-dark': colors.primaryDark,
    '--color-secondary': colors.secondary,
    '--color-accent': colors.accent
  };
};