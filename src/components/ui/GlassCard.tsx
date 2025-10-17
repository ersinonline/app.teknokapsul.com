import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hover = true,
  onClick 
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        glass-card
        rounded-2xl p-6
        ${hover ? 'hover-lift cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Premium Card Variant
interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
  onClick?: () => void;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({ 
  children, 
  className = '',
  gradient = 'from-blue-500 to-purple-600',
  onClick 
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        premium-card-interactive
        bg-gradient-to-br ${gradient}
        text-white
        rounded-2xl p-6
        relative overflow-hidden
        ${className}
      `}
    >
      {children}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
    </div>
  );
};
