import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton rounded-lg', className)} />;
}

export function ServerCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-24" />
      <div className="flex justify-around">
        <Skeleton className="h-[72px] w-[72px] rounded-full" />
        <Skeleton className="h-[72px] w-[72px] rounded-full" />
        <Skeleton className="h-[72px] w-[72px] rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-card p-5">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-5 w-28" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-7 w-10 rounded-md" />
          ))}
        </div>
      </div>
      <Skeleton className="h-[250px] w-full rounded-lg" />
    </div>
  );
}
