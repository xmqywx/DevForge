"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  LuChevronLeft,
  LuChevronRight,
  LuBug,
  LuSquareCheckBig,
  LuMessageSquare,
  LuRocket,
  LuNotebook,
  LuFlag,
  LuGitCommitHorizontal,
} from "react-icons/lu";
import { useI18n } from "@/lib/i18n";

// ---- Types ----

interface CalendarEvent {
  id: string;
  type: "issue" | "issue-resolved" | "feedback" | "release" | "note" | "milestone" | "commit";
  title: string;
  date: string;
  projectName: string;
  projectSlug: string;
  metadata?: Record<string, string>;
}

interface CalendarStats {
  issuesCreated: number;
  issuesResolved: number;
  releasesPublished: number;
  feedbackReceived: number;
}

// ---- Constants ----

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ---- Event type config ----

type EventType = CalendarEvent["type"];

const EVENT_CONFIG: Record<EventType, { label: string; dotClass: string; bgClass: string; textClass: string }> = {
  issue: {
    label: "New Issue",
    dotClass: "bg-red-500",
    bgClass: "bg-red-50",
    textClass: "text-red-700",
  },
  "issue-resolved": {
    label: "Resolved",
    dotClass: "bg-emerald-500",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
  },
  feedback: {
    label: "Feedback",
    dotClass: "bg-purple-500",
    bgClass: "bg-purple-50",
    textClass: "text-purple-700",
  },
  release: {
    label: "Release",
    dotClass: "bg-blue-500",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
  },
  note: {
    label: "Note",
    dotClass: "bg-amber-500",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
  },
  milestone: {
    label: "Milestone",
    dotClass: "bg-[#c6e135]",
    bgClass: "bg-[#f0f8c0]",
    textClass: "text-[#4a6000]",
  },
  commit: {
    label: "Commit",
    dotClass: "bg-gray-400",
    bgClass: "bg-gray-50",
    textClass: "text-gray-600",
  },
};

function EventIcon({ type, className = "" }: { type: EventType; className?: string }) {
  const props = { size: 14, className };
  switch (type) {
    case "issue": return <LuBug {...props} />;
    case "issue-resolved": return <LuSquareCheckBig {...props} />;
    case "feedback": return <LuMessageSquare {...props} />;
    case "release": return <LuRocket {...props} />;
    case "note": return <LuNotebook {...props} />;
    case "milestone": return <LuFlag {...props} />;
    case "commit": return <LuGitCommitHorizontal {...props} />;
  }
}

// ---- Helpers ----

function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatTime(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function buildCalendarGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startPad = firstDay.getDay(); // 0=Sun
  const grid: (Date | null)[] = [];

  for (let i = 0; i < startPad; i++) grid.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) grid.push(new Date(year, month - 1, d));
  // Pad end to complete final week
  while (grid.length % 7 !== 0) grid.push(null);

  return grid;
}

// ---- Sub-components ----

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex-1 min-w-0">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-3xl font-bold ${accent ? "text-[#1a1a1a]" : "text-[#c6e135]"}`}>
        {value}
      </div>
    </div>
  );
}

function EventPill({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) {
  const cfg = EVENT_CONFIG[event.type];
  return (
    <div
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium leading-tight ${cfg.bgClass} ${cfg.textClass} min-w-0`}
      title={`${event.title} — ${event.projectName}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dotClass}`} />
      <span className="truncate">{compact ? event.title : event.title}</span>
    </div>
  );
}

interface DayCellProps {
  date: Date | null;
  events: CalendarEvent[];
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  onClick: () => void;
}

function DayCell({ date, events, isToday, isSelected, isCurrentMonth, onClick }: DayCellProps) {
  const { t } = useI18n();
  if (!date) {
    return <div className="h-28 bg-transparent" />;
  }

  const MAX_VISIBLE = 3;
  const visible = events.slice(0, MAX_VISIBLE);
  const overflow = events.length - MAX_VISIBLE;

  return (
    <button
      onClick={onClick}
      className={`h-28 p-1.5 rounded-xl border text-left transition-all w-full
        ${isSelected
          ? "border-[#c6e135] bg-[#f8fce0] shadow-sm"
          : isToday
          ? "border-[#c6e135]/60 bg-white shadow-sm"
          : "border-transparent bg-white/60 hover:bg-white hover:border-gray-200 hover:shadow-sm"
        }
        ${!isCurrentMonth ? "opacity-40" : ""}
      `}
    >
      <div className="flex items-start justify-between mb-1">
        <span
          className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
            ${isToday ? "bg-[#c6e135] text-[#1a1a1a]" : "text-gray-700"}
          `}
        >
          {date.getDate()}
        </span>
        {events.length > 0 && (
          <span className="text-[10px] text-gray-400 leading-none">{events.length} {t("calendar.events")}</span>
        )}
      </div>
      <div className="space-y-0.5 overflow-hidden">
        {visible.map((ev) => (
          <EventPill key={ev.id} event={ev} compact />
        ))}
        {overflow > 0 && (
          <div className="text-[10px] text-gray-400 pl-1">+{overflow} more</div>
        )}
      </div>
    </button>
  );
}

interface DayDetailProps {
  date: Date;
  events: CalendarEvent[];
  onClose: () => void;
}

function DayDetail({ date, events, onClose }: DayDetailProps) {
  const { t } = useI18n();
  const label = date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#1a1a1a] text-base">{label}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {t("common.cancel")}
        </button>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">{t("calendar.noEvents")}</p>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const cfg = EVENT_CONFIG[ev.type];
            return (
              <div key={ev.id} className={`flex items-start gap-3 p-3 rounded-xl ${cfg.bgClass}`}>
                <div className={`mt-0.5 ${cfg.textClass}`}>
                  <EventIcon type={ev.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-semibold ${cfg.textClass} leading-snug`}>
                      {ev.title}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.bgClass} ${cfg.textClass} border border-current/20`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {ev.projectSlug ? (
                      <Link
                        href={`/projects/${ev.projectSlug}`}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {ev.projectName}
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">{ev.projectName}</span>
                    )}
                    {ev.metadata && Object.entries(ev.metadata).map(([k, v]) =>
                      v ? (
                        <span key={k} className="text-xs text-gray-400">
                          {k}: <span className="text-gray-600">{v}</span>
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Legend ----

function Legend() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([type, cfg]) => (
        <div key={type} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
          <span className="text-xs text-gray-500">{cfg.label}</span>
        </div>
      ))}
    </div>
  );
}

// ---- Main Component ----

export function CalendarView() {
  const { t } = useI18n();
  const today = new Date();
  const todayStr = toLocalDateString(today);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<CalendarStats>({
    issuesCreated: 0,
    issuesResolved: 0,
    releasesPublished: 0,
    feedbackReceived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchEvents = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar?year=${y}&month=${m}`);
      const data = await res.json();
      setEvents(data.events ?? []);
      setStats(data.stats ?? { issuesCreated: 0, issuesResolved: 0, releasesPublished: 0, feedbackReceived: 0 });
    } catch (err) {
      console.error("Failed to fetch calendar events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(year, month);
  }, [year, month, fetchEvents]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }

  // Group events by date
  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  const grid = buildCalendarGrid(year, month);

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];
  const selectedDateObj = selectedDate ? new Date(selectedDate + "T00:00:00") : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#1a1a1a]">{t("calendar.title")}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <LuChevronLeft size={16} />
          </button>
          <span className="text-base font-semibold text-[#1a1a1a] min-w-[140px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <LuChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-4">
        <StatCard label={t("calendar.issuesCreated")} value={stats.issuesCreated} />
        <StatCard label={t("calendar.issuesResolved")} value={stats.issuesResolved} accent />
        <StatCard label={t("calendar.releasesPublished")} value={stats.releasesPublished} />
        <StatCard label={t("calendar.feedbackReceived")} value={stats.feedbackReceived} />
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl shadow-sm px-5 py-3">
        <Legend />
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 uppercase py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {grid.map((date, i) => {
              const dateStr = date ? toLocalDateString(date) : null;
              const dayEvents = dateStr ? (eventsByDate[dateStr] ?? []) : [];
              const isCurrentMonth = date ? date.getMonth() + 1 === month : false;
              return (
                <DayCell
                  key={i}
                  date={date}
                  events={dayEvents}
                  isToday={dateStr === todayStr}
                  isSelected={dateStr === selectedDate}
                  isCurrentMonth={isCurrentMonth}
                  onClick={() => {
                    if (!dateStr) return;
                    setSelectedDate(prev => prev === dateStr ? null : dateStr);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Day Detail Panel */}
      {selectedDate && selectedDateObj && (
        <DayDetail
          date={selectedDateObj}
          events={selectedEvents}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
