import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { onShowError } from '../../utils/showError';

export default function ErrorToast() {
  const [message, setMessage] = useState(null);

  const dismiss = useCallback(() => setMessage(null), []);

  useEffect(() => {
    const unsub = onShowError(setMessage);
    return unsub;
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(dismiss, 6000);
    return () => clearTimeout(timer);
  }, [message, dismiss]);

  if (!message) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up w-[calc(100%-32px)] max-w-[400px]">
      <div className="flex items-center gap-3 px-5 py-4 bg-danger-bg border border-danger-main/20 rounded-[14px] shadow-lg">
        <div className="p-1.5 rounded-[8px] bg-danger-main/10 shrink-0">
          <AlertTriangle className="w-5 h-5 text-danger-main" />
        </div>
        <p className="flex-1 text-[14px] font-medium text-danger-main leading-snug">
          {message}
        </p>
        <button
          onClick={dismiss}
          className="p-1.5 rounded-[8px] hover:bg-danger-main/10 transition-colors shrink-0"
        >
          <X className="w-4 h-4 text-danger-main" />
        </button>
      </div>
    </div>
  );
}
