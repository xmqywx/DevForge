"use client";
import { useState } from "react";
import { LuThumbsUp } from "react-icons/lu";

export function VoteButton({ feedbackId, initialVotes }: { feedbackId: number; initialVotes: number }) {
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(false);

  async function handleVote() {
    if (voted) return;
    const res = await fetch(`/api/feedback/${feedbackId}/vote`, { method: "POST" });
    if (res.ok) { setVotes(v => v + 1); setVoted(true); }
  }

  return (
    <button onClick={handleVote} disabled={voted}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        voted ? "bg-[#c6e135] text-[#1a1a1a]" : "bg-gray-100 text-gray-600 hover:bg-[#c6e135] hover:text-[#1a1a1a]"
      }`}>
      <LuThumbsUp className="w-4 h-4" />
      {votes}
    </button>
  );
}
