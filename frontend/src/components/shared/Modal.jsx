import { useEffect } from 'react';
import { X } from 'lucide-react';
import IconButton from './IconButton';

export default function Modal({ open, onClose, title, children, className = '' }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full max-w-[440px] max-h-[85vh] rounded-[20px] bg-surface-default border border-border-default shadow-xl flex flex-col animate-scale-in z-10 ${className}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default shrink-0">
          <h2 id="modal-title" className="text-[18px] font-semibold text-text-primary tracking-tight">
            {title}
          </h2>
          <IconButton size="sm" variant="ghost" onClick={onClose} ariaLabel="Close dialog">
            <X className="w-4 h-4 text-text-muted hover:text-text-primary" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}