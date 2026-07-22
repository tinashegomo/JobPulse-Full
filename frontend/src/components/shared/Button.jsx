import { motion } from 'framer-motion';

const VARIANTS = {
  primary:
    'bg-brand-primary text-white hover:bg-brand-hover active:bg-brand-pressed border border-transparent shadow-none',
  secondary:
    'bg-surface-elevated text-text-primary border border-border-default hover:bg-surface-muted active:bg-surface-muted/80 shadow-none',
  danger:
    'bg-danger-main text-white hover:bg-danger-hover active:bg-danger-pressed border border-transparent shadow-none',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-muted hover:text-text-primary active:bg-surface-muted/50 border border-transparent shadow-none',
};

const SIZES = {
  sm: 'h-9 px-4 text-[13px] gap-2 rounded-[12px]',
  md: 'h-11 px-5 text-[14px] gap-2 rounded-[12px]', // 44px height, 20px horizontal padding, 12px radius
  lg: 'h-12 px-6 text-[16px] gap-3 rounded-[12px]', // 48px height
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium transition-colors duration-150 select-none cursor-pointer ${
        fullWidth ? 'w-full' : ''
      } ${VARIANTS[variant] || VARIANTS.primary} ${
        SIZES[size] || SIZES.md
      } ${
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
