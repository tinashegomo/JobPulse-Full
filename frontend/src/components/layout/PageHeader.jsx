/**
 * PageHeader primitive enforcing:
 * - Clear visual hierarchy
 * - Inter font scale (H1: 28px/bold or H2: 24px/bold)
 * - 24px bottom section spacing
 */
export default function PageHeader({
  title,
  subtitle,
  action,
  leftAction,
  className = '',
}) {
  return (
    <header className={`flex flex-col gap-1 mb-6 pt-2 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {leftAction && <div className="shrink-0">{leftAction}</div>}
          <h1 className="text-[24px] font-bold tracking-tight text-text-primary truncate">
            {title}
          </h1>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {subtitle && (
        <p className="text-[14px] font-normal text-text-secondary leading-normal">
          {subtitle}
        </p>
      )}
    </header>
  );
}
