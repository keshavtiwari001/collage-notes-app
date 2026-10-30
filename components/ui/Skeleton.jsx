export default function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ backgroundColor: 'var(--bg-hover)', ...style }}
    />
  );
}

// Pre-built skeleton layouts for common pages
export function PeriodCardSkeleton() {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
      </div>
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2 mb-4" />
      <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-3 w-20 ml-auto" />
      </div>
    </div>
  );
}

export function ChapterRowSkeleton() {
  return (
    <div
      className="rounded-xl border px-5 py-4"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      <div className="flex items-center gap-4">
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function PartSkeleton() {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: 'var(--bg-hover)' }}>
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="px-5 py-6 space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

export function QACardSkeleton() {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-hover)' }}>
        <div className="flex items-start gap-3">
          <Skeleton className="w-6 h-5 rounded" />
          <Skeleton className="h-5 flex-1" />
        </div>
      </div>
      <div className="px-5 py-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}
