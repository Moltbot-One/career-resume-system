import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  color,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-text-secondary">进度</span>
          <span className="text-xs font-medium text-text-primary">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color || 'bg-primary')}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
