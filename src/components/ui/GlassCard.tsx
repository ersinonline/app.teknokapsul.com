import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  onClick 
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bank-card
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Premium Card Variant - Banking Style
interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({ 
  children, 
  className = '',
  onClick 
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bank-card-interactive
        ${className}
      `}
    >
      {children}
    </div>
  );
};
