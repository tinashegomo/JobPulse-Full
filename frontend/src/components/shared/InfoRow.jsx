import React from 'react';
import { MapPin, Clock, Briefcase, DollarSign } from 'lucide-react';

/**
 * InfoRow metadata row primitive:
 * Standardizes metadata display (Location, Salary, Time Posted, Source)
 * with consistent icons and a dot separator only between location and time.
 */
export default function InfoRow({
  location,
  postedText,
  source,
  jobType,
  salary,
  className = '',
}) {
  const items = [];

  if (location) {
    items.push({
      id: 'location',
      icon: MapPin,
      text: location,
    });
  }

  if (jobType) {
    items.push({
      id: 'jobType',
      icon: Briefcase,
      text: jobType,
    });
  }

  if (salary) {
    items.push({
      id: 'salary',
      icon: DollarSign,
      text: salary,
    });
  }

  if (postedText) {
    items.push({
      id: 'postedText',
      icon: Clock,
      text: postedText,
    });
  }

  if (items.length === 0 && !source) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[14px] text-text-secondary leading-tight ${className}`}
    >
      {items.map((item) => {
        const IconComponent = item.icon;
        const showDot = item.id === 'postedText' && location;
        return (
          <React.Fragment key={item.id}>
            {showDot && <span className="text-text-muted/60 select-none">•</span>}
            <div className="flex items-center gap-1.5 min-w-0">
              <IconComponent className="w-5 h-5 text-text-muted shrink-0" />
              <span className="truncate">{item.text}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
