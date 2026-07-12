import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';

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

/** Normaliza para búsqueda: minúsculas + sin acentos. */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

/** Umbral a partir del cual mostramos el buscador automáticamente. */
const AUTO_SEARCH_THRESHOLD = 8;

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Fuerza mostrar/ocultar el buscador. Por defecto se activa solo si hay muchas opciones. */
  searchable?: boolean;
  searchPlaceholder?: string;
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
  searchable,
  searchPlaceholder = 'Buscar…',
  ...rest
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
  const options = useMemo(() => parseOptions(children), [children]);
  const stringValue = String(value ?? '');
  const selected = options.find((o) => o.value === stringValue);

  const showSearch = searchable ?? options.length > AUTO_SEARCH_THRESHOLD;

  const filtered = useMemo(() => {
    if (!showSearch || !query.trim()) return options;
    const q = norm(query.trim());
    return options.filter((o) => norm(o.label).includes(q));
  }, [options, query, showSearch]);

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

  // Al abrir: reset búsqueda, foco al input, posicionar activo en el seleccionado.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(Math.max(0, options.findIndex((o) => o.value === stringValue)));
      if (showSearch) {
        const t = setTimeout(() => inputRef.current?.focus(), 0);
        return () => clearTimeout(t);
      }
    }
  }, [open]);

  // Reset del índice activo cuando cambia el filtro.
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt && !opt.disabled) pick(opt.value);
    }
  };

  const menu = open ? (
    <div
      ref={menuRef}
      style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
      className="fixed z-[200] rounded-lg border border-stone-200 bg-white shadow-lg ring-1 ring-black/5"
    >
      {showSearch && (
        <div className="border-b border-stone-100 p-1.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border border-stone-200 bg-stone-50 py-1.5 pl-7 pr-2 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-200"
            />
          </div>
        </div>
      )}
      <ul role="listbox" className="max-h-60 overflow-auto py-1">
        {filtered.map((opt, idx) => {
          const isSelected = opt.value === stringValue;
          const isActive = idx === activeIndex;
          return (
            <li key={`${opt.value}-${opt.label}`} role="option" aria-selected={isSelected}>
              <button
                type="button"
                disabled={opt.disabled}
                onClick={() => pick(opt.value)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors ${
                  isSelected
                    ? 'bg-brand-50 text-brand-900 font-medium'
                    : isActive
                      ? 'bg-stone-100 text-stone-800'
                      : 'text-stone-800'
                } ${opt.disabled ? 'cursor-not-allowed opacity-40' : ''}`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-brand-700" />}
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-3 py-2 text-sm text-stone-400">Sin resultados</li>
        )}
      </ul>
    </div>
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
