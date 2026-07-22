/**
 * AppShell primitive layout wrapper enforcing:
 * - Mobile-first responsive container scale
 * - 480px / 768px / 1024px / 1140px max-width breakpoints
 * - Clean horizontal page padding
 * - Full viewport height layout with scrollable content
 * - Safe area padding for bottom navigation
 */
export default function AppShell({ children, className = '' }) {
  return (
    <div className="min-h-dvh bg-bg-default text-text-primary flex flex-col items-center">
      <div className={`w-full max-w-[480px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1140px] min-h-dvh flex flex-col px-4 md:px-6 lg:px-8 pt-4 pb-24 ${className}`}>
        {children}
      </div>
    </div>
  );
}
