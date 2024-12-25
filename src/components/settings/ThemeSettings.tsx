import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeSettings = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-medium mb-4">Tema Ayarları</h2>
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setTheme('light')}
          className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
            theme === 'light' ? 'border-yellow-500 bg-yellow-50' : 'hover:bg-gray-50'
          }`}
        >
          <Sun className="w-6 h-6 text-yellow-600" />
          <span>Açık</span>
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
            theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
        >
          <Moon className="w-6 h-6 text-blue-600" />
          <span>Koyu</span>
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
            theme === 'system' ? 'border-gray-500 bg-gray-50' : 'hover:bg-gray-50'
          }`}
        >
          <Monitor className="w-6 h-6 text-gray-600" />
          <span>Sistem</span>
        </button>
      </div>
    </div>
  );
};