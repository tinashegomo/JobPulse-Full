import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import countries from 'world-countries';

const REGION_ORDER = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];

const grouped = (() => {
  const map = {};
  for (const c of countries) {
    const region = c.region;
    if (!region || region === 'Antarctic') continue;
    if (!map[region]) map[region] = [];
    map[region].push(c.name.common);
  }
  for (const r of Object.keys(map)) {
    map[r].sort((a, b) => a.localeCompare(b));
  }
  return map;
})();

const ALL_COUNTRIES = Object.values(grouped).flat();

export default function CountrySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      setSearch('');
    }
  }, [open]);

  const q = search.toLowerCase().trim();
  const filtered = q
    ? ALL_COUNTRIES.filter((c) => c.toLowerCase().includes(q))
    : null;

  const CountryButton = ({ name }) => (
    <button
      type="button"
      onClick={() => {
        onChange(name);
        setOpen(false);
      }}
      className={`w-full text-left px-12 py-2 text-body-normal transition-colors rounded-input ${
        value === name
          ? 'bg-brand-tint text-brand-primary font-medium'
          : 'text-text-primary hover:bg-surface-muted'
      }`}
    >
      {name}
    </button>
  );

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-8 h-14 px-4 rounded-[12px] border bg-surface-elevated text-[16px] text-left outline-none transition-all duration-200 ${
          value
            ? 'text-text-primary border-border-default focus:border-border-focus focus-ring'
            : 'text-text-muted border-border-default focus:border-border-focus focus-ring'
        }`}
      >
        <span className="truncate">{value || 'Select a country'}</span>
        <ChevronDown
          size={14}
          className={`text-text-muted transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-4 w-full min-h-[240px] max-h-[320px] rounded-card bg-surface-default border border-border-default shadow-elevation-3 overflow-hidden flex flex-col animate-scale-in">
          <div className="p-8 border-b border-border-default">
            <div className="flex items-center gap-6 px-10 py-6 rounded-input bg-surface-elevated border border-border-default">
              <Search size={13} className="text-text-muted shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search countries..."
                className="w-full bg-transparent text-body-normal text-text-primary outline-none placeholder:text-text-muted"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-text-muted hover:text-text-primary shrink-0"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filtered ? (
              filtered.length === 0 ? (
                <div className="px-12 py-10 text-body-normal text-text-muted">
                  No countries found
                </div>
              ) : (
                <div className="py-2">
                  {filtered.map((name) => (
                    <CountryButton key={name} name={name} />
                  ))}
                </div>
              )
            ) : (
              REGION_ORDER.map(
                (region) =>
                  grouped[region] && (
                    <div key={region} className="py-2">
                      <div className="px-12 py-4 text-ui-caption font-semibold text-text-muted uppercase tracking-wider">
                        {region}
                      </div>
                      {grouped[region].map((name) => (
                        <CountryButton key={name} name={name} />
                      ))}
                    </div>
                  )
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
