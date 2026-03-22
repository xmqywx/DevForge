"use client";
import { LuPlus, LuSearch, LuFilter, LuMessageSquare, LuCalendar } from "react-icons/lu";

const ACTIONS = [
  { icon: LuPlus, label: "Add" },
  { icon: LuSearch, label: "Search" },
  { icon: LuFilter, label: "Filter" },
  { icon: LuMessageSquare, label: "Messages" },
  { icon: LuCalendar, label: "Calendar" },
];

export function FloatingActions() {
  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3">
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          title={action.label}
          className="w-12 h-12 bg-[#1a1a1a] text-white rounded-full flex items-center justify-center hover:bg-[#333] transition-colors shadow-lg"
        >
          <action.icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
}
