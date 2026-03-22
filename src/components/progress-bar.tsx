import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between text-sm text-gray-600">
        <span>{label ?? "Progress"}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#c6e135] rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
