import React from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClassName?: string;
  closeOnBackdrop?: boolean;
};

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  maxWidthClassName = 'max-w-lg',
  closeOnBackdrop = true,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${maxWidthClassName} max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-4 p-6 border-b border-stone-100 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-stone-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {footer ? (
          <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end gap-2 flex-shrink-0">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
