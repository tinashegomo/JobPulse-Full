/**
 * Input primitive enforcing:
 * - Height: 52px (h-[52px])
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
    <div className={`flex flex-col gap-2 w-full ${containerClassName}`}>
      {label && (
        <label className="text-[16px] font-semibold text-text-primary leading-tight">
          {label}
        </label>
      )}
      <input
        className={`w-full h-[52px] px-4 rounded-[12px] border bg-surface-default text-[16px] text-text-primary placeholder:text-text-muted transition-all duration-150 outline-none ${
          error
            ? 'border-danger-main focus:ring-2 focus:ring-danger-main/20'
            : 'border-border-default focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="text-[13px] font-medium text-danger-main">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span className="text-[13px] text-text-muted">
          {helperText}
        </span>
      )}
    </div>
  );
}
