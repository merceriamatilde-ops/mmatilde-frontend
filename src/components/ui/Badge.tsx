import React from 'react';

export function Badge({ 
  className = '', 
  variant = 'default',
  children 
}: { 
  className?: string; 
  variant?: 'default' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  const variants = {
    default: 'bg-stone-100 text-stone-900',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800'
  };
  
  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
