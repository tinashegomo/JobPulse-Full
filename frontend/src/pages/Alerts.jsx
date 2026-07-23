import { useAlerts } from '../hooks/useAlerts';
import { useKeywords } from '../hooks/useKeywords';
import AlertCard from '../components/alerts/AlertCard';
import AlertForm from '../components/alerts/AlertForm';
import PageHeader from '../components/layout/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import SkeletonJobCard from '../components/shared/SkeletonJobCard';
import StatCard from '../components/shared/StatCard';
import FilterChip from '../components/shared/FilterChip';
import { Bell, Bookmark, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Alerts() {
  const { alerts, loading, error, addAlert, editAlert, removeAlert } = useAlerts();
  const { keywords, save: saveKeyword, remove: removeKeyword } = useKeywords();

  const handleToggle = (alertId, enabled) => {
    editAlert(alertId, { enabled });
  };

  const activeCount = alerts.filter((a) => a.enabled !== false).length;

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Header */}
      <PageHeader
        title="Search Alerts"
        subtitle="Manage search queries monitored by the scraper"
        action={
          <AlertForm
            onSubmit={addAlert}
            alertCount={alerts.length}
            keywords={keywords}
            onSaveKeyword={saveKeyword}
          />
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Active Alerts"
          value={activeCount}
          icon={CheckCircle2}
        />
        <StatCard
          label="Saved Keywords"
          value={keywords.length}
          icon={Bookmark}
        />
      </div>

      {/* Saved Keywords Row */}
      {keywords.length > 0 && (
        <div className="flex flex-col gap-2 pt-1">
          <span className="text-[12px] font-semibold text-text-muted uppercase tracking-wider px-1">
            Quick Keywords <span className="normal-case font-normal text-text-muted/70">(click to remove)</span>
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {keywords.map((k) => (
              <FilterChip
                key={k.id}
                label={k.keyword}
                onClick={() => removeKeyword(k.id)}
                className="hover:border-danger-main/30 hover:text-danger-main"
              />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-danger-bg border border-danger-main/20 rounded-[12px] text-danger-main text-[13px] font-medium">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col gap-3">
          <SkeletonJobCard />
          <SkeletonJobCard />
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No search alerts set"
          description="Create a search alert to start monitoring job boards for matching positions."
          action={
            <AlertForm
              onSubmit={addAlert}
              alertCount={alerts.length}
              keywords={keywords}
              onSaveKeyword={saveKeyword}
            />
          }
        />
      ) : (
        /* Alerts List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-stagger pt-1">
          <span className="text-[12px] font-semibold text-text-muted uppercase tracking-wider px-1">
            Your Alerts ({alerts.length})
          </span>
          {alerts.length >= 20 && (
            <div className="flex items-center gap-3 p-4 rounded-[12px] bg-warning-main/10 border border-warning-main/20 text-warning-main text-[13px] font-medium col-span-full">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Maximum limit of 20 alerts reached. Delete an existing alert to create a new one.</span>
            </div>
          )}
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onToggle={handleToggle}
              onDelete={removeAlert}
            />
          ))}
        </div>
      )}
    </div>
  );
}
