import { Inbox } from 'lucide-react';

/**
 * EmptyState primitive enforcing:
 * - Centered layout
 * - Soft tint circular icon container
 * - Title + Description + CTA button
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-surface-default border border-border-default/60 rounded-[16px] animate-fade-in ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-brand-tint flex items-center justify-center mb-4 text-brand-primary">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-[18px] font-semibold text-text-primary tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 text-[14px] text-text-secondary max-w-[320px] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
