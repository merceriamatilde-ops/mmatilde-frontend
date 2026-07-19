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
    <div className={`mb-6 ${className}`}>
      <h2 className="font-outfit text-[clamp(1.5rem,4vw,2rem)] font-bold tracking-tight text-brand-800">
        {title}
      </h2>
      {(subtitle || action) && (
        <div className="mt-1 flex items-baseline justify-between gap-3">
          {subtitle ? <p className="min-w-0 text-stone-500">{subtitle}</p> : <span />}
          {action ? (
            <Link
              to={action.to}
              className="shrink-0 text-sm font-semibold text-brand-700 underline decoration-brand-200 underline-offset-4 transition-colors hover:text-brand-900 hover:decoration-brand-500 md:text-[15px] md:no-underline"
            >
              {action.label}
              <span aria-hidden className="ml-0.5">
                →
              </span>
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
