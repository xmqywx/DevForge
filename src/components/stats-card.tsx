interface StatsCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

function MiniSparkline() {
  return (
    <svg width="64" height="32" viewBox="0 0 64 32" fill="none" className="text-[#c6e135] opacity-60">
      <path
        d="M2 28 L12 20 L22 24 L32 12 L42 16 L52 6 L62 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function StatsCard({
  label,
  value,
  subtitle,
  color,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-500 uppercase tracking-wide">{label}</div>
          <div className={`text-4xl font-bold mt-1 ${color ?? "text-[#c6e135]"}`}>
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
          )}
        </div>
        <MiniSparkline />
      </div>
    </div>
  );
}
