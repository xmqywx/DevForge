"use client";

import { useEffect, useState } from "react";
import { ProjectTable, type ProjectRow } from "@/components/project-table";
import { useI18n } from "@/lib/i18n";

export default function ProjectsPage() {
  const { t } = useI18n();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load projects");
        return r.json();
      })
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-[#c6e135] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">{t("projects.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-sm">
          <p className="text-red-500 font-medium">{t("projects.errorLoading")}</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return <ProjectTable initialProjects={projects} />;
}
