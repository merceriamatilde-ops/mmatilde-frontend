import React from 'react';
import { ChevronRight } from 'lucide-react';

/** Inline + line-clamp-2: hasta 2 líneas, después "…" */
export function Breadcrumb({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <nav
      aria-label="Miga de pan"
      className={`line-clamp-2 break-words text-sm leading-5 text-stone-500 ${className}`}
    >
      {children}
    </nav>
  );
}

export function BreadcrumbSep() {
  return (
    <ChevronRight
      size={14}
      aria-hidden
      className="mx-0.5 inline-block shrink-0 align-[-2px] text-stone-400"
    />
  );
}
