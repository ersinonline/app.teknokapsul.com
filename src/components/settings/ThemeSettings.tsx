import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeSettings = () => {
  const { settings, updateTheme, isDark } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors">
      <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Tema Ayarları</h2>
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => updateTheme('light')}
          className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200 hover:scale-105 ${
            settings.theme === 'light' 
              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-lg' 
              : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Sun className={`w-6 h-6 ${settings.theme === 'light' ? 'text-yellow-600' : 'text-gray-600 dark:text-gray-400'}`} />
          <span className={`text-sm font-medium ${settings.theme === 'light' ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-300'}`}>Açık</span>
        </button>
        <button
          onClick={() => updateTheme('dark')}
          className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200 hover:scale-105 ${
            settings.theme === 'dark' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' 
              : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Moon className={`w-6 h-6 ${settings.theme === 'dark' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
          <span className={`text-sm font-medium ${settings.theme === 'dark' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>Koyu</span>
        </button>
        <button
          onClick={() => updateTheme('system')}
          className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200 hover:scale-105 ${
            settings.theme === 'system' 
              ? 'border-gray-500 bg-gray-50 dark:bg-gray-700/50 shadow-lg' 
              : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Monitor className={`w-6 h-6 ${settings.theme === 'system' ? 'text-gray-600 dark:text-gray-400' : 'text-gray-600 dark:text-gray-400'}`} />
          <span className={`text-sm font-medium ${settings.theme === 'system' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'}`}>Sistem</span>
        </button>
      </div>
      
      {/* Current theme indicator */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Şu anda <span className="font-medium text-gray-900 dark:text-white">{isDark ? 'koyu' : 'açık'}</span> tema aktif
        </p>
      </div>
    </div>
  );
};