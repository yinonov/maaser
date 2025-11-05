// Loading skeleton components for better perceived performance

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-6 py-3">
        <div className="grid grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="grid grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(j => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <Skeleton className="h-6 w-1/3 mb-4" />
      <Skeleton className="h-4 w-2/3 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <Skeleton className="h-4 w-1/3 mb-2" />
      <Skeleton className="h-8 w-2/3 mb-1" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-5 w-1/4 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="h-5 w-1/3 mb-2" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Skeleton className="h-5 w-1/4 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-5 w-1/4 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="flex justify-end gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
