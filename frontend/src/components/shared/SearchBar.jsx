import { X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Search jobs, companies, keywords...',
  className = '',
}) {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-14 pl-4 pr-12 bg-surface-default border border-border-default rounded-[12px] text-[15px] text-text-primary placeholder:text-text-muted focus-ring transition-all duration-150"
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3.5 p-1.5 text-text-muted hover:text-text-primary rounded-full transition-colors"
          aria-label="Clear search"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
