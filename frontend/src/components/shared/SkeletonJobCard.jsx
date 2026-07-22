export default function SkeletonJobCard() {
  return (
    <div className="p-4 bg-surface-default border border-border-default rounded-[16px] flex flex-col gap-3 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="h-3 w-24 bg-surface-muted rounded-[4px]" />
        <div className="h-5 w-16 bg-surface-muted rounded-pill" />
      </div>
      <div className="h-5 w-3/4 bg-surface-muted rounded-[6px]" />
      <div className="flex items-center gap-3 pt-1">
        <div className="h-3.5 w-20 bg-surface-muted rounded-[4px]" />
        <div className="h-3.5 w-16 bg-surface-muted rounded-[4px]" />
        <div className="h-3.5 w-12 bg-surface-muted rounded-[4px]" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border-default/50">
        <div className="h-8 w-24 bg-surface-muted rounded-[10px]" />
        <div className="h-8 w-20 bg-surface-muted rounded-[10px]" />
      </div>
    </div>
  );
}
