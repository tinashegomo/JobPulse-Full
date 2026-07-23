import { Bell, BellOff } from 'lucide-react';
import Button from './Button';

const PermissionBanner = ({ permission, onRequestPermission }) => {
  if (permission === 'granted') return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-[12px] bg-surface-elevated border border-border-default animate-slide-up">
      <div className="shrink-0 p-2 rounded-[8px] bg-warning-main/10">
        {permission === 'denied' ? (
          <BellOff size={18} className="text-warning-main" />
        ) : (
          <Bell size={18} className="text-warning-main" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[14px] font-semibold text-text-primary leading-tight">
          {permission === 'denied'
            ? 'Notifications blocked'
            : 'Enable notifications'}
        </h3>
        <p className="text-[12px] text-text-muted leading-snug mt-0.5">
          {permission === 'denied'
            ? 'Enable in browser settings to receive job alerts.'
            : 'Get notified instantly when new jobs match your alerts.'}
        </p>
      </div>
      {permission === 'default' && (
        <Button
          onClick={onRequestPermission}
          variant="primary"
          size="sm"
          className="shrink-0"
        >
          Enable
        </Button>
      )}
    </div>
  );
};

export default PermissionBanner;
