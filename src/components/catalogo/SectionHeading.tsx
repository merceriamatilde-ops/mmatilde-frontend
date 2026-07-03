import React from 'react';
import { Link } from 'react-router-dom';

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  action?: { label: string; to: string };
  className?: string;
};

export function SectionHeading({ title, subtitle, action, className = '' }: SectionHeadingProps) {
  return (
    <div className={`mb-6 flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div>
        <h2 className="font-outfit text-[clamp(1.5rem,4vw,2rem)] font-bold tracking-tight text-brand-800">
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-stone-500">{subtitle}</p> : null}
      </div>
      {action ? (
        <Link
          to={action.to}
          className="shrink-0 text-[15px] font-semibold text-brand-600 transition-colors hover:text-brand-800"
        >
          {action.label} →
        </Link>
      ) : null}
    </div>
  );
}
