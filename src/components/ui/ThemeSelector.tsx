import React from 'react';
import { ThemeMode, ColorScheme } from '../../contexts/ThemeContext';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeSelector: React.FC = () => {
  const { mode, colorScheme, setMode, setColorScheme, colors } = useTheme();

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: 'Açık' },
    { value: 'dark', label: 'Koyu' },
    { value: 'system', label: 'Sistem' }
  ];

  const colorOptions: { value: ColorScheme; label: string }[] = [
    { value: 'blue', label: 'Mavi' },
    { value: 'green', label: 'Yeşil' },
    { value: 'purple', label: 'Mor' },
    { value: 'orange', label: 'Turuncu' },
    { value: 'pink', label: 'Pembe' }
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tema Modu
        </label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as ThemeMode)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {themeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Renk Şeması
        </label>
        <select
          value={colorScheme}
          onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {colorOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Önizleme
        </h4>
        <div className="flex space-x-2">
          <div
            className="w-6 h-6 rounded-full border border-gray-300"
            style={{ backgroundColor: colors.primary }}
            title="Ana Renk"
          />
          <div
            className="w-6 h-6 rounded-full border border-gray-300"
            style={{ backgroundColor: colors.primaryDark }}
            title="Ana Renk (Koyu)"
          />
          <div
            className="w-6 h-6 rounded-full border border-gray-300"
            style={{ backgroundColor: colors.secondary }}
            title="İkincil Renk"
          />
          <div
            className="w-6 h-6 rounded-full border border-gray-300"
            style={{ backgroundColor: colors.accent }}
            title="Vurgu Rengi"
          />
        </div>
      </div>
    </div>
  );
};