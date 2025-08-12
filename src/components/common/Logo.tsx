import React from 'react';
import { Package } from 'lucide-react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`flex items-center justify-start ml-4 ${className}`}>
      <Package className="w-8 h-8 text-yellow-600" />
      <div className="ml-2 flex flex-col">
        <span className="text-xl font-bold text-gray-900">TeknoKapsül</span>
      </div>
    </div>
  );
};