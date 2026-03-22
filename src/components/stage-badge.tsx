const STAGE_CONFIG: Record<string, { bg: string; text: string; icon: string }> =
  {
    idea: { bg: "bg-slate-800", text: "text-slate-400", icon: "💭" },
    dev: { bg: "bg-blue-900/50", text: "text-blue-400", icon: "🔨" },
    beta: { bg: "bg-amber-900/50", text: "text-amber-400", icon: "🧪" },
    live: { bg: "bg-green-900/50", text: "text-green-400", icon: "🚀" },
    paused: { bg: "bg-red-900/50", text: "text-red-400", icon: "⏸" },
    archived: {
      bg: "bg-stone-900/50",
      text: "text-stone-400",
      icon: "📦",
    },
  };

export function StageBadge({ stage }: { stage: string }) {
  const config = STAGE_CONFIG[stage] ?? STAGE_CONFIG.idea;
  return (
    <span
      className={`${config.bg} ${config.text} px-2 py-0.5 rounded-full text-xs`}
    >
      {config.icon} {stage.charAt(0).toUpperCase() + stage.slice(1)}
    </span>
  );
}
