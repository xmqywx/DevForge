import { notFound } from "next/navigation";
import { DOC_SECTIONS, getDocSection } from "@/content/docs";
import { DocsSidebar } from "@/components/docs-sidebar";
import { DocsContent } from "@/components/docs-content";

export default async function DocsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const doc = getDocSection(section);

  if (!doc) {
    notFound();
  }

  return (
    <div className="flex gap-6 min-h-[calc(100vh-120px)]">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0">
        <DocsSidebar sections={DOC_SECTIONS} activeSlug={section} />
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0">
        <DocsContent doc={doc} />
      </main>
    </div>
  );
}

export function generateStaticParams() {
  return DOC_SECTIONS.map((s) => ({ section: s.slug }));
}
