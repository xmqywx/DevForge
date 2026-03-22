"use client";
import { useState } from "react";
import { LuSend, LuUpload } from "react-icons/lu";

interface Project { slug: string; name: string; id: number; }

export function FeedbackForm({ projects }: { projects: Project[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append("files", f));
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.urls) setImages(prev => [...prev, ...data.urls]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: Number(fd.get("project")),
        type: fd.get("type"),
        title: fd.get("title"),
        description: fd.get("description"),
        authorName: fd.get("author_name") || undefined,
        website: fd.get("website"), // honeypot
        images,
      }),
    });
    if (res.ok) setSuccess(true);
    setSubmitting(false);
  }

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-[#c6e135] rounded-full flex items-center justify-center mx-auto mb-4">
          <LuSend className="w-8 h-8 text-[#1a1a1a]" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Thanks for your feedback!</h2>
        <p className="text-gray-500">We will review it and update the status.</p>
        <a href="/feedback" className="text-[#65a30d] hover:underline mt-4 inline-block">View all feedback</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      {/* Honeypot */}
      <input name="website" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
        <select name="project" required className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e135]">
          <option value="">Select project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
        <select name="type" defaultValue="feature" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e135]">
          <option value="bug">Bug Report</option>
          <option value="feature">Feature Request</option>
          <option value="improvement">Improvement</option>
          <option value="question">Question</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input name="title" required placeholder="Brief summary..." className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e135]" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea name="description" rows={5} placeholder="Describe in detail (Markdown supported)..." className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e135]" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Name (optional)</label>
        <input name="author_name" placeholder="Anonymous if empty" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e135]" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Screenshots (max 5)</label>
        <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-[#c6e135] transition-colors">
          <LuUpload className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">Click to upload images</span>
          <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
        {images.length > 0 && (
          <div className="flex gap-2 mt-2">
            {images.map((url, i) => <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-lg border" />)}
          </div>
        )}
      </div>

      <button type="submit" disabled={submitting} className="w-full bg-[#c6e135] text-[#1a1a1a] font-semibold py-3 rounded-xl hover:bg-[#b5d025] transition-colors disabled:opacity-50">
        {submitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}
