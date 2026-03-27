"use client";

import { useState, useCallback } from "react";
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

interface Props {
  feedback: FeedbackItem;
  onClose: () => void;
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

export function FeedbackReplyDrawer({ feedback, onClose }: Props) {
  const { t } = useI18n();
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Write your reply…" }),
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none p-3 min-h-[120px]",
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
        const res = await fetch("/api/upload-proxy", {
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
      setSuccess(true);
      editor.commands.clearContent();
      setTimeout(onClose, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

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
          <div className="min-w-0">
            <h2 className="font-semibold text-[#1a1a1a] text-sm">
              {t("feedback.replyTo")} Feedback
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

        {/* Original feedback preview */}
        <div className="px-5 py-3 bg-[#f0f0e8] border-b border-gray-200 shrink-0">
          <p className="text-xs text-gray-500 font-medium mb-1">
            {feedback.authorName ?? "Anonymous"} wrote:
          </p>
          {feedback.description ? (
            <div
              className="text-xs text-gray-600 line-clamp-3 prose prose-xs max-w-none"
              dangerouslySetInnerHTML={{ __html: feedback.description }}
            />
          ) : (
            <p className="text-xs text-gray-400 italic">No description</p>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
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
            <ToolbarBtn
              title="Insert image"
              onClick={handleImageUpload}
            >
              {uploadingImage ? (
                <LuLoaderCircle className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LuImagePlus className="w-3.5 h-3.5" />
              )}
            </ToolbarBtn>
          </div>

          {/* Editor area */}
          <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#c6e135] transition-shadow flex-1">
            <EditorContent editor={editor} />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {success && (
            <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg font-medium">
              Reply sent successfully!
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSend}
            disabled={sending || success}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium bg-[#c6e135] text-[#1a1a1a] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {sending ? (
              <LuLoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <LuSend className="w-4 h-4" />
            )}
            {t("feedback.sendReply")}
          </button>
        </div>
      </div>
    </>
  );
}
