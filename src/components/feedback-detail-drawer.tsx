"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  LuX,
  LuBold,
  LuItalic,
  LuList,
  LuListOrdered,
  LuCode,
  LuLoaderCircle,
  LuSend,
  LuImagePlus,
} from "react-icons/lu";
import type { FeedbackItem } from "./feedback-admin-list";
import { useI18n } from "@/lib/i18n";

const SERVER_URL =
  process.env.NEXT_PUBLIC_DEVFORGE_SERVER_URL ?? "https://forge.wdao.chat";

export interface FeedbackReply {
  id: string;
  feedbackId: string;
  authorName: string | null;
  isOwner: boolean | null;
  content: string;
  avatarUrl: string | null;
  createdAt: string | null;
}

interface Props {
  feedback: FeedbackItem;
  onClose: () => void;
}

function dicebearAvatar(name: string | null) {
  const seed = encodeURIComponent(name ?? "A");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
}

function resolveImageUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SERVER_URL}${path}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ToolbarBtn({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-[#c6e135] text-[#1a1a1a]"
          : "text-gray-500 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

export function FeedbackDetailDrawer({ feedback, onClose }: Props) {
  const { t } = useI18n();
  const [replies, setReplies] = useState<FeedbackReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchReplies = useCallback(async () => {
    setLoading(true);
    try {
      // Try server first
      const res = await fetch(
        `${SERVER_URL}/api/feedback/${feedback.id}/replies`
      );
      if (res.ok) {
        const data = await res.json();
        setReplies(data);
        return;
      }
    } catch {
      /* fall through to local */
    }
    try {
      const res = await fetch(`/api/feedback/${feedback.id}/replies`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
    setLoading(false);
  }, [feedback.id]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  // Scroll to bottom when replies load or new reply sent
  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [replies, loading]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: t("feedback.writeReply") }),
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none p-3 min-h-[80px]",
      },
    },
  });

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;
      setUploadingImage(true);
      try {
        const form = new FormData();
        form.append("files", file);
        const res = await fetch(`${SERVER_URL}/api/upload`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        const url: string = data.urls?.[0] ?? "";
        if (url) {
          const fullUrl = url.startsWith("http") ? url : `${SERVER_URL}${url}`;
          editor
            .chain()
            .focus()
            .insertContent(
              `<img src="${fullUrl}" alt="${file.name}" style="max-width:100%" />`
            )
            .run();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Image upload failed");
      } finally {
        setUploadingImage(false);
      }
    };
    input.click();
  }, [editor]);

  const handleSend = async () => {
    if (!editor) return;
    const content = editor.getHTML();
    if (!content || editor.isEmpty) {
      setError("Reply cannot be empty");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/feedback-proxy/${feedback.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to send reply");
      }
      setSendSuccess(true);
      editor.commands.clearContent();
      await fetchReplies();
      setTimeout(() => setSendSuccess(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  // Render HTML safely (images get server prefix)
  function renderContent(html: string) {
    const fixed = html.replace(
      /src="(\/[^"]+)"/g,
      `src="${SERVER_URL}$1"`
    );
    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: fixed }} />;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-[#1a1a1a] text-sm">
              {t("feedback.detail")}
            </h2>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {feedback.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors ml-3 shrink-0"
          >
            <LuX className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#f8f8f4]">
          {/* Original feedback message — left aligned */}
          <div className="flex items-start gap-3 max-w-[90%]">
            <img
              src={dicebearAvatar(feedback.authorName)}
              alt={feedback.authorName ?? "Anonymous"}
              className="w-8 h-8 rounded-full shrink-0 bg-gray-100 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-700">
                  {feedback.authorName ?? "Anonymous"}
                </span>
                <span className="text-[10px] text-gray-400">
                  {formatDate(feedback.createdAt)}
                </span>
                {feedback.type && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                    {feedback.type}
                  </span>
                )}
                {feedback.status && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-gray-300 text-gray-600 font-medium">
                    {feedback.status.replace(/-/g, " ")}
                  </span>
                )}
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <p className="text-sm font-semibold text-[#1a1a1a] mb-1">
                  {feedback.title}
                </p>
                {feedback.description && renderContent(feedback.description)}
                {/* Feedback images */}
                {(feedback.images ?? []).filter(Boolean).length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {(feedback.images ?? []).filter(Boolean).map((src, i) => (
                      <a
                        key={i}
                        href={resolveImageUrl(src)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={resolveImageUrl(src)}
                          alt={`attachment ${i + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-100 hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Replies */}
          {loading ? (
            <div className="flex justify-center py-6">
              <LuLoaderCircle className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : replies.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-4">
              {t("feedback.noReplies")}
            </p>
          ) : (
            replies.map((reply) => {
              const isOwner = reply.isOwner === true;
              return (
                <div
                  key={reply.id}
                  className={`flex items-start gap-3 ${
                    isOwner ? "flex-row-reverse ml-auto max-w-[90%]" : "max-w-[90%]"
                  }`}
                >
                  <img
                    src={reply.avatarUrl ?? dicebearAvatar(reply.authorName)}
                    alt={reply.authorName ?? "Anonymous"}
                    className="w-8 h-8 rounded-full shrink-0 bg-gray-100 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`flex items-center gap-2 mb-1 ${
                        isOwner ? "flex-row-reverse" : ""
                      }`}
                    >
                      <span className="text-xs font-semibold text-gray-700">
                        {reply.authorName ?? "Anonymous"}
                      </span>
                      {isOwner && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#c6e135] text-[#1a1a1a] font-semibold">
                          Owner
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {formatDate(reply.createdAt)}
                      </span>
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm ${
                        isOwner
                          ? "bg-[#c6e135]/20 rounded-tr-sm"
                          : "bg-white rounded-tl-sm"
                      }`}
                    >
                      {renderContent(reply.content)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply editor */}
        <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0 space-y-2">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 flex-wrap">
            <ToolbarBtn
              title="Bold"
              active={editor?.isActive("bold")}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <LuBold className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              title="Italic"
              active={editor?.isActive("italic")}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <LuItalic className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              title="Code"
              active={editor?.isActive("code")}
              onClick={() => editor?.chain().focus().toggleCode().run()}
            >
              <LuCode className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <ToolbarBtn
              title="Bullet list"
              active={editor?.isActive("bulletList")}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <LuList className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              title="Ordered list"
              active={editor?.isActive("orderedList")}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            >
              <LuListOrdered className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <ToolbarBtn title="Insert image" onClick={handleImageUpload}>
              {uploadingImage ? (
                <LuLoaderCircle className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LuImagePlus className="w-3.5 h-3.5" />
              )}
            </ToolbarBtn>
          </div>

          {/* Editor area + send */}
          <div className="flex items-end gap-2">
            <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#c6e135] transition-shadow">
              <EditorContent editor={editor} />
            </div>
            <button
              onClick={handleSend}
              disabled={sending || sendSuccess}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium bg-[#c6e135] text-[#1a1a1a] hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0 self-end mb-0.5"
            >
              {sending ? (
                <LuLoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                <LuSend className="w-4 h-4" />
              )}
              {t("feedback.sendReply")}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          {sendSuccess && (
            <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg font-medium">
              {t("feedback.replySent")}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
