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

export function ProjectCard(props: ProjectCardProps) {
  return (
    <Link href={`/projects/${props.slug}`}>
      <div className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer">
        {/* Top row: name + badge */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold text-lg text-[#1a1a1a]">{props.name}</h3>
          <StageBadge stage={props.stage} />
        </div>

        {/* Progress */}
        <ProgressBar value={props.progressPct} />

        {/* Tags */}
        {props.tags.length > 0 && (
          <div className="flex gap-1.5 mt-4 flex-wrap">
            {props.tags.map((tag) => (
              <span
                key={tag}
                className="border border-gray-300 rounded-full px-2 py-0.5 text-xs text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
