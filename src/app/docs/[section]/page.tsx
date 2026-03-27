"use client";

import { useParams } from "next/navigation";
import { DOC_SECTIONS, getDocSection } from "@/content/docs";
import { DocsSidebar } from "@/components/docs-sidebar";
import { DocsContent } from "@/components/docs-content";

export default function DocsSectionPage() {
  const params = useParams<{ section: string }>();
  const section = params.section;
  const doc = getDocSection(section);

  if (!doc) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-gray-500">Section not found.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 min-h-[calc(100vh-120px)]">
      <aside className="w-60 flex-shrink-0">
        <DocsSidebar sections={DOC_SECTIONS} activeSlug={section} />
      </aside>
      <main className="flex-1 min-w-0">
        <DocsContent doc={doc} />
      </main>
    </div>
  );
}
