import React from 'react';
import { Input } from './Input';

type InputWithIconProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ComponentType<{ className?: string }>;
};

export function InputWithIcon({ icon: Icon, className = '', ...props }: InputWithIconProps) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <Input className={`pl-10 ${className}`} {...props} />
    </div>
  );
}
