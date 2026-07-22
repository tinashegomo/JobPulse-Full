import { Bell, BellOff } from 'lucide-react';
import Button from './Button';

const PermissionBanner = ({ permission, onRequestPermission }) => {
  if (permission === 'granted') return null;

  return (
    <div className="glass-panel p-18 flex items-center gap-14 animate-slide-up border-l-4 border-l-warning-main">
      <div className="shrink-0 p-10 bg-warning-bg rounded-card">
        {permission === 'denied' ? (
          <BellOff size={22} className="text-warning-main" />
        ) : (
          <Bell size={22} className="text-warning-main" />
        )}
      </div>
      <div className="flex-1">
        <h3 className="text-h4 font-semibold text-text-primary">
          {permission === 'denied'
            ? 'Notifications are blocked'
            : 'Enable push notifications'}
        </h3>
        <p className="mt-4 text-body-small text-text-secondary">
          {permission === 'denied'
            ? 'Please enable notifications in your browser settings to receive job alerts.'
            : 'Get notified instantly when new jobs match your search alerts.'}
        </p>
      </div>
      {permission === 'default' && (
        <Button
          onClick={onRequestPermission}
          variant="primary"
          size="md"
          className="shrink-0"
        >
          Enable
        </Button>
      )}
    </div>
  );
};

export default PermissionBanner;
