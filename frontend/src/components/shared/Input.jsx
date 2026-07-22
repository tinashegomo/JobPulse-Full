/**
 * Input primitive enforcing:
 * - Height: 48px (h-12)
 * - Radius: 12px (rounded-[12px])
 * - Padding: 16px horizontal (px-4)
 * - Clear label and modern subtle error text
 */
export default function Input({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && (
        <label className="text-[13px] font-medium text-text-secondary leading-tight">
          {label}
        </label>
      )}
      <input
        className={`w-full h-12 px-4 rounded-[12px] border bg-surface-default text-[14px] text-text-primary placeholder:text-text-muted transition-all duration-150 outline-none ${
          error
            ? 'border-danger-main focus:ring-2 focus:ring-danger-main/20'
            : 'border-border-default focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="text-[12px] font-medium text-danger-main">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span className="text-[12px] text-text-muted">
          {helperText}
        </span>
      )}
    </div>
  );
}
