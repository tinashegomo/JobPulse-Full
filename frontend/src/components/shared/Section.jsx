export default function Section({
  title,
  subtitle,
  action,
  children,
  className = '',
}) {
  return (
    <section className={`mb-6 flex flex-col gap-3 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2">
          <div>
            {title && (
              <h2 className="text-[18px] font-semibold tracking-tight text-text-primary">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-[13px] font-normal text-text-secondary">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
