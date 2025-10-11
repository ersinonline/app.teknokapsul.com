import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`flex items-center justify-start ml-4 ${className}`}>
      <img 
        src="/logo.ico" 
        alt="TeknoKapsül Logo" 
        className="w-8 h-8"
      />
      <div className="ml-2 flex flex-col">
        <span className="text-xl font-bold text-gray-900">TeknoKapsül</span>
      </div>
    </div>
  );
};