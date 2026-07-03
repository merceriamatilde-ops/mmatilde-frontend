import React from 'react';

type ProductGridProps = {
  children: React.ReactNode;
  className?: string;
};

export function ProductGrid({ children, className = '' }: ProductGridProps) {
  return (
    <div
      className={`grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 md:grid-cols-4 md:gap-3 lg:grid-cols-5 xl:grid-cols-6 ${className}`}
    >
      {children}
    </div>
  );
}
