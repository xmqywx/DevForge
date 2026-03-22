const STAGE_CONFIG: Record<string, string> = {
  idea: "bg-gray-100 text-gray-600",
  dev: "bg-blue-100 text-blue-700",
  beta: "bg-amber-100 text-amber-700",
  live: "bg-[#c6e135] text-[#1a1a1a]",
  active: "bg-[#c6e135] text-[#1a1a1a]",
  paused: "border border-gray-300 text-gray-600",
  "on-hold": "border border-gray-300 text-gray-600",
  archived: "bg-gray-200 text-gray-500",
};

export function StageBadge({ stage }: { stage: string }) {
  const cls = STAGE_CONFIG[stage] ?? STAGE_CONFIG.idea;
  const label = stage.charAt(0).toUpperCase() + stage.slice(1);
  return (
    <span className={`${cls} px-3 py-1 rounded-full text-xs font-medium`}>
      {label}
    </span>
  );
}
