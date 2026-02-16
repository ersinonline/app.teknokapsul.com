import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
    const { setTheme } = useTheme();

    return (
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
                onClick={() => setTheme('light')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-white text-slate-900 shadow-sm"
                title="Açık"
            >
                <span className="text-sm">☀️</span>
                <span className="hidden sm:inline">Açık</span>
            </button>
        </div>
    );
};

export default ThemeToggle;
