import { X, Bell } from 'lucide-react';

const Toast = ({ title, body, url, onClose }) => {
  const handleClick = () => {
    if (url) window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed bottom-24 right-16 z-50 animate-slide-up">
      <div className="glass-panel p-16 flex items-start gap-12 max-w-[360px] border-l-4 border-l-brand-primary shadow-lg">
        <div className="shrink-0 p-8 bg-brand-tint rounded-card">
          <Bell size={18} className="text-brand-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            onClick={handleClick}
            className="text-ui-label font-semibold text-text-primary cursor-pointer hover:text-brand-primary transition-colors"
          >
            {title}
          </p>
          {body && (
            <p className="mt-4 text-body-small text-text-secondary line-clamp-2">
              {body}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-4 rounded-input hover:bg-surface-muted transition-colors"
        >
          <X size={14} className="text-text-muted" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
