import React from 'react';
import { Lightbulb, Clock } from 'lucide-react';

interface GelecekOzelliklerProps {
  title: string;
  icon: 'lightbulb' | 'clock';
}

const GelecekOzellikler: React.FC<GelecekOzelliklerProps> = ({ title, icon }) => {
  const Icon = icon === 'lightbulb' ? Lightbulb : Clock;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm text-center border-2 border-dashed border-gray-300">
      <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full mx-auto flex items-center justify-center mb-3">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-bold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">Çok yakında burada!</p>
    </div>
  );
};

export default GelecekOzellikler;