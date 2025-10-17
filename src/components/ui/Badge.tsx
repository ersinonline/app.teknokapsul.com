import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  className = ''
}) => {
  const variants = {
    default: 'badge',
    primary: 'badge badge-primary',
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    error: 'badge badge-error',
    info: 'badge badge-info',
  };

  return (
    <span className={`${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
