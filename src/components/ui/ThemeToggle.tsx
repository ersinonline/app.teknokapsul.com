import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle = () => {
  const { settings, updateTheme } = useTheme();

  const getNextTheme = () => {
    switch (settings.theme) {
      case 'light': return 'dark';
      case 'dark': return 'system';
      case 'system': return 'light';
      default: return 'light';
    }
  };

  const getIcon = () => {
    switch (settings.theme) {
      case 'light': return <Sun className="w-5 h-5" />;
      case 'dark': return <Moon className="w-5 h-5" />;
      case 'system': return <Monitor className="w-5 h-5" />;
      default: return <Sun className="w-5 h-5" />;
    }
  };

  const getLabel = () => {
    switch (settings.theme) {
      case 'light': return 'Açık';
      case 'dark': return 'Koyu';
      case 'system': return 'Sistem';
      default: return 'Açık';
    }
  };

  return (
    <button
      onClick={() => updateTheme(getNextTheme())}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
      title={`Şu anda: ${getLabel()} tema`}
    >
      <span className="text-gray-600 dark:text-gray-400">
        {getIcon()}
      </span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
        {getLabel()}
      </span>
    </button>
  );
};