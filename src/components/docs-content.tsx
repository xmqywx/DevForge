"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useState } from "react";
import { DocSection } from "@/content/docs";

interface DocsContentProps {
  doc: DocSection;
}

export function DocsContent({ doc }: DocsContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [portals, setPortals] = useState<Array<{ el: Element; code: string }>>(
    []
  );

  useEffect(() => {
    if (!contentRef.current) return;

    const preElements = Array.from(contentRef.current.querySelectorAll("pre"));
    const newPortals: Array<{ el: Element; code: string }> = [];

    preElements.forEach((pre) => {
      const code = pre.querySelector("code");
      if (!code) return;

      // Remove existing wrapper if any (e.g., on slug change)
      const existing = pre.querySelector(".copy-btn-container");
      if (existing) existing.remove();

      const wrapper = document.createElement("span");
      wrapper.className = "copy-btn-container";
      pre.appendChild(wrapper);

      newPortals.push({ el: wrapper, code: code.textContent ?? "" });
    });

    setPortals(newPortals);
  }, [doc.slug]);

  return (
    <>
      <article className="bg-white rounded-2xl shadow-sm p-8">
        <div
          ref={contentRef}
          className="docs-content"
          dangerouslySetInnerHTML={{ __html: doc.content }}
        />

        <style>{`
          .docs-content h1 {
            font-size: 1.875rem;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 1.5rem;
            margin-top: 0;
          }
          .docs-content h2 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1a1a1a;
            margin-top: 2rem;
            margin-bottom: 0.75rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #f0f0e8;
          }
          .docs-content h3 {
            font-size: 1rem;
            font-weight: 600;
            color: #1a1a1a;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
          }
          .docs-content p {
            color: #374151;
            line-height: 1.75;
            margin-bottom: 1rem;
          }
          .docs-content ul, .docs-content ol {
            color: #374151;
            line-height: 1.75;
            margin-bottom: 1rem;
            padding-left: 1.5rem;
          }
          .docs-content li {
            margin-bottom: 0.25rem;
          }
          .docs-content code:not(pre code) {
            background: #f0f0e8;
            color: #1a1a1a;
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
            font-size: 0.875em;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          }
          .docs-content pre {
            background: #1a1a1a;
            color: #e5e7eb;
            padding: 1rem 1.25rem;
            padding-right: 5rem;
            border-radius: 0.75rem;
            overflow-x: auto;
            margin-bottom: 1.25rem;
            position: relative;
          }
          .docs-content pre code {
            background: transparent;
            color: inherit;
            padding: 0;
            font-size: 0.875rem;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            white-space: pre;
          }
          .docs-content .copy-btn-container {
            position: absolute;
            top: 8px;
            right: 8px;
          }
          .docs-content table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1.25rem;
            font-size: 0.875rem;
          }
          .docs-content th {
            background: #f0f0e8;
            padding: 0.625rem 0.875rem;
            text-align: left;
            font-weight: 600;
            color: #1a1a1a;
            border-bottom: 2px solid #e5e7eb;
          }
          .docs-content td {
            padding: 0.625rem 0.875rem;
            border-bottom: 1px solid #f0f0e8;
            color: #374151;
            vertical-align: top;
          }
          .docs-content tr:last-child td {
            border-bottom: none;
          }
          .docs-content a {
            color: #4a7c00;
            text-decoration: underline;
          }
          .docs-content a:hover {
            color: #1a1a1a;
          }
        `}</style>
      </article>

      {/* Copy buttons via portals into pre elements */}
      {portals.map(({ el, code }, i) =>
        createPortal(<CopyButton key={i} code={code} />, el)
      )}
    </>
  );
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className="px-2 py-1 text-xs rounded-md bg-[#c6e135] text-[#1a1a1a] font-medium hover:bg-[#b5d12e] transition-colors whitespace-nowrap"
      aria-label="Copy code"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
