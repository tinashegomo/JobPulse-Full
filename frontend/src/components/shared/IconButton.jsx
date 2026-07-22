import { motion } from 'framer-motion';

const VARIANTS = {
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-muted hover:text-text-primary active:bg-surface-muted/60 border border-transparent',
  secondary:
    'bg-surface-elevated text-text-primary border border-border-default hover:bg-surface-muted active:bg-surface-muted/80',
  primary:
    'bg-brand-primary text-white hover:bg-brand-hover active:bg-brand-pressed border border-transparent',
  danger:
    'bg-danger-bg text-danger-main hover:bg-danger-hover/10 border border-transparent',
};

const SIZES = {
  sm: 'w-9 h-9 text-[18px] rounded-[10px]',
  md: 'w-11 h-11 text-[20px] rounded-[12px]',
  lg: 'w-12 h-12 text-[22px] rounded-[12px]',
};

export default function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled = false,
  ariaLabel,
  ...props
}) {
  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center transition-colors duration-150 cursor-pointer shrink-0 select-none ${
        VARIANTS[variant] || VARIANTS.ghost
      } ${SIZES[size] || SIZES.md} ${
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
