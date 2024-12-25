import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`card rounded-xl shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
};