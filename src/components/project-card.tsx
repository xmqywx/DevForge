import Link from "next/link";
import { StageBadge } from "./stage-badge";
import { ProgressBar } from "./progress-bar";

interface ProjectCardProps {
  slug: string;
  name: string;
  description: string;
  icon: string;
  stage: string;
  progressPct: number;
  tags: string[];
  lastCommitDate?: string;
  branch?: string;
  openIssueCount: number;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export function ProjectCard(props: ProjectCardProps) {
  const timeAgo = props.lastCommitDate
    ? formatTimeAgo(new Date(props.lastCommitDate))
    : "—";
  return (
    <Link href={`/projects/${props.slug}`}>
      <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-800 hover:border-slate-600 transition-colors cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-lg">
              {props.icon}
            </span>
            <div>
              <div className="font-semibold text-sm">{props.name}</div>
              <div className="text-xs text-slate-500 truncate max-w-[180px]">
                {props.description}
              </div>
            </div>
          </div>
          <StageBadge stage={props.stage} />
        </div>
        {props.tags.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {props.tags.map((tag) => (
              <span
                key={tag}
                className="bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full text-[10px]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-800 pt-2 mb-2">
          <span>📝 {timeAgo}</span>
          <span>🔀 {props.branch ?? "—"}</span>
          <span>⚠️ {props.openIssueCount} issues</span>
        </div>
        <ProgressBar value={props.progressPct} label="Progress" />
      </div>
    </Link>
  );
}
