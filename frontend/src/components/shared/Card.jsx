/**
 * Card primitive enforcing:
 * - 16px internal padding (p-4)
 * - 16px border-radius (rounded-[16px])
 * - Subtle border + soft shadow
 */
export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`p-5 rounded-[16px] bg-surface-default border border-border-default shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] transition-all duration-150 ${
        hover ? 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
