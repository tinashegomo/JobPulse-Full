import { motion } from 'framer-motion';

/**
 * FilterChip primitive enforcing:
 * - Rounded pill (999px)
 * - 12px caption text weight 500
 * - Subtle background + smooth state toggle
 */
export default function FilterChip({
  label,
  active = false,
  onClick,
  count,
  className = '',
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12px] font-medium transition-colors duration-150 cursor-pointer select-none shrink-0 ${
        active
          ? 'bg-brand-primary text-white font-semibold'
          : 'bg-surface-muted text-text-secondary hover:bg-surface-elevated hover:text-text-primary border border-border-default'
      } ${className}`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
            active ? 'bg-white/20 text-white' : 'bg-border-default text-text-muted'
          }`}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
}
