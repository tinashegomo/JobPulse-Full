import { Trash2, ToggleLeft, ToggleRight, MapPin, Search } from 'lucide-react';
import Card from '../shared/Card';
import Badge from '../shared/Badge';
import IconButton from '../shared/IconButton';

const WORK_TYPE_VARIANTS = {
  remote: 'success',
  hybrid: 'info',
  'on-site': 'warning',
};

const WORK_TYPE_LABELS = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  'on-site': 'On-site',
};

export default function AlertCard({ alert, onToggle, onDelete }) {
  const isEnabled = alert.enabled !== false;

  return (
    <Card className="flex flex-col gap-3 h-full bg-surface-default border-border-default">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant={isEnabled ? 'success' : 'neutral'}>
            {isEnabled ? 'Active' : 'Paused'}
          </Badge>
          {alert.workType && (
            <Badge variant={WORK_TYPE_VARIANTS[alert.workType] || 'neutral'}>
              {WORK_TYPE_LABELS[alert.workType] || alert.workType}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <IconButton
            size="sm"
            variant="ghost"
            onClick={() => onToggle(alert.id, !isEnabled)}
            ariaLabel={isEnabled ? 'Pause alert' : 'Activate alert'}
          >
            {isEnabled ? (
              <ToggleRight className="w-5 h-5 text-success-main" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-text-muted" />
            )}
          </IconButton>
          <IconButton
            size="sm"
            variant="danger"
            onClick={() => onDelete(alert.id)}
            ariaLabel="Delete alert"
          >
            <Trash2 className="w-5 h-5" />
          </IconButton>
        </div>
      </div>

      <h3 className="text-[16px] font-semibold text-text-primary leading-tight truncate">
        {alert.label || alert.keyword}
      </h3>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-text-secondary">
        {alert.keyword && (
          <div className="flex items-center gap-1.5">
            <Search className="w-[18px] h-[18px] text-text-muted" />
            <span className="truncate">{alert.keyword}</span>
          </div>
        )}
        {alert.keyword && alert.location && <span className="text-text-muted/60">•</span>}
        {alert.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-[18px] h-[18px] text-text-muted" />
            <span className="truncate">{alert.location}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
