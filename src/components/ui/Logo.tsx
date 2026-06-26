import React from 'react';

export function Logo({ className = "w-48 h-auto" }: { className?: string }) {
  return (
    <img 
      src="/logo-merceria.svg" 
      alt="Matilde Mercería Logo" 
      className={className} 
    />
  );
}
