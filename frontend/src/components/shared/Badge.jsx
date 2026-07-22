const VARIANTS = {
  brand: 'bg-brand-tint text-brand-primary border border-brand-primary/10 font-medium',
  success: 'bg-success-main/10 text-success-main border border-success-main/15 font-medium',
  info: 'bg-info-main/10 text-info-main border border-info-main/15 font-medium',
  warning: 'bg-warning-main/10 text-warning-main border border-warning-main/15 font-medium',
  danger: 'bg-danger-bg text-danger-main border border-danger-main/15 font-medium',
  neutral: 'bg-surface-muted text-text-secondary border border-border-default font-medium',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-pill text-[12px] leading-tight select-none transition-colors ${
        VARIANTS[variant] || VARIANTS.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}
