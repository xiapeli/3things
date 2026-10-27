import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "CONFIRMAR EXCLUSÃO",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]" role="presentation">
      <div className="bg-white neo-brutal-border neo-brutal-shadow max-w-md w-full" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
        <div className="bg-red-500 p-4 border-b-2 border-black">
          <h2 id="confirm-title" className="text-xl font-black text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            {title}
          </h2>
        </div>
        <div className="p-6">
          <p id="confirm-description" className="text-black font-bold mb-6">{description}</p>
          <div className="flex gap-3">
            <button ref={cancelRef} type="button" onClick={onCancel} className="neo-brutal-button bg-gray-300 text-black px-4 py-2 flex-1">
              CANCELAR
            </button>
            <button type="button" onClick={onConfirm} className="neo-brutal-button bg-red-500 text-white px-4 py-2 flex-1">
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
