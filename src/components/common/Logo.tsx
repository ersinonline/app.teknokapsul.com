import React from 'react';
import { Package } from 'lucide-react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Package className="w-8 h-8 text-yellow-600" />
      <span className="ml-2 text-xl font-bold text-gray-900">TeknoKapsül</span>
    </div>
  );
};