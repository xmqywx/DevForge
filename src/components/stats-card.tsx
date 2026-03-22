interface StatsCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export function StatsCard({
  label,
  value,
  color = "text-slate-50",
}: StatsCardProps) {
  return (
    <div className="bg-[#1e293b] rounded-lg p-4 text-center">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}
