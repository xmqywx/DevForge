import Link from "next/link";
import { LuCode } from "react-icons/lu";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f0f0e8] text-[#1a1a1a]">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#c6e135] rounded-lg flex items-center justify-center">
            <LuCode className="w-5 h-5 text-[#1a1a1a]" />
          </div>
          <span className="font-bold text-lg">DevForge</span>
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/p" className="hover:text-[#1a1a1a] text-gray-500">Projects</Link>
          <Link href="/feedback" className="hover:text-[#1a1a1a] text-gray-500">Feedback</Link>
          <Link href="/roadmap" className="hover:text-[#1a1a1a] text-gray-500">Roadmap</Link>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
