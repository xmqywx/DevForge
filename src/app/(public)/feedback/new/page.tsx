import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { FeedbackForm } from "@/components/feedback-form";

export const dynamic = "force-dynamic";

export default function NewFeedbackPage() {
  const publicProjects = db
    .select({ id: projects.id, slug: projects.slug, name: projects.name })
    .from(projects)
    .where(eq(projects.isPublic, true))
    .all();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Submit Feedback</h1>
        <p className="text-gray-500 mt-1">Help us improve by reporting bugs or requesting features.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <FeedbackForm projects={publicProjects} />
      </div>
    </div>
  );
}
