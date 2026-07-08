import React from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'danger',
  onConfirm,
  onClose,
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? () => undefined : onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={loading}>
            {loading ? 'Procesando...' : confirmLabel}
          </Button>
        </>
      }
      maxWidthClassName="max-w-md"
    >
      {description ? <p className="text-sm text-stone-600 leading-relaxed">{description}</p> : null}
    </Modal>
  );
}
