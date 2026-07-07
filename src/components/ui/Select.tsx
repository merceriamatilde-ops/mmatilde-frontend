import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

type ParsedOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

function parseOptions(children: React.ReactNode): ParsedOption[] {
  const options: ParsedOption[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child) || child.type !== 'option') return;
    const props = child.props as { value?: string | number; disabled?: boolean; children?: React.ReactNode };
    const label =
      typeof props.children === 'string' || typeof props.children === 'number'
        ? String(props.children)
        : React.Children.toArray(props.children).join('');
    options.push({
      value: String(props.value ?? ''),
      label,
      disabled: props.disabled,
    });
  });
  return options;
}

export function Select({
  className = '',
  children,
  value,
  onChange,
  disabled,
  name,
  id,
  required,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
  const options = useMemo(() => parseOptions(children), [children]);
  const stringValue = String(value ?? '');
  const selected = options.find((o) => o.value === stringValue);

  const pick = (next: string) => {
    const opt = options.find((o) => o.value === next);
    if (opt?.disabled) return;
    onChange?.({ target: { value: next, name } } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      const r = btnRef.current!.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const menu = open ? (
    <ul
      ref={menuRef}
      role="listbox"
      style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
      className="fixed z-[200] max-h-60 overflow-auto rounded-lg border border-stone-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
    >
      {options.map((opt) => {
        const isSelected = opt.value === stringValue;
        return (
          <li key={`${opt.value}-${opt.label}`} role="option" aria-selected={isSelected}>
            <button
              type="button"
              disabled={opt.disabled}
              onClick={() => pick(opt.value)}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors ${
                isSelected
                  ? 'bg-brand-50 text-brand-900 font-medium'
                  : 'text-stone-800 hover:bg-stone-100'
              } ${opt.disabled ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              <span className="truncate">{opt.label}</span>
              {isSelected && <Check className="h-4 w-4 shrink-0 text-brand-700" />}
            </button>
          </li>
        );
      })}
    </ul>
  ) : null;

  return (
    <div className="relative min-w-0" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`admin-select flex w-full items-center justify-between gap-2 text-left ${className} ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        }`}
        {...(rest as object)}
      >
        <span className="truncate">{selected?.label || '—'}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          value={stringValue}
          required={required}
          onChange={() => {}}
        />
      )}

      {menu && createPortal(menu, document.body)}
    </div>
  );
}
