export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className = '',
}) {
  return (
    <div
      className={`p-5 bg-surface-default border border-border-default rounded-[16px] flex flex-col justify-between gap-3 shadow-none transition-all duration-150 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-text-secondary truncate">
          {label}
        </span>
        {Icon && (
          <div className="p-2 rounded-[10px] bg-brand-tint text-brand-primary shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-bold text-text-primary leading-none">
          {value}
        </span>
        {trend && (
          <span className="text-[12px] font-medium text-success-main">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
