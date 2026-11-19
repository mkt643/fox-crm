"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PostMockup } from "@/components/post-mockup";
import { approvePost, requestAdjustment } from "./actions";

type Media = { id: string; url?: string; kind: string };
type Highlight = { id: string; start: number; end: number; comment: string };

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function ApprovalCard({
  postId,
  type,
  caption,
  scheduledDate,
  media,
  clientName,
  logoUrl,
  accentColor,
}: {
  postId: string;
  type: string;
  caption: string;
  scheduledDate: string | null;
  media: Media[];
  clientName: string;
  logoUrl?: string;
  accentColor: string;
}) {
  const router = useRouter();
  const captionRef = useRef<HTMLParagraphElement>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [generalComment, setGeneralComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"approve" | "adjust" | null>(null);

  function handleCaptionMouseUp() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !captionRef.current) return;
    if (!captionRef.current.contains(selection.anchorNode)) return;

    const preRange = document.createRange();
    preRange.selectNodeContents(captionRef.current);
    preRange.setEnd(selection.anchorNode!, selection.anchorOffset);
    const anchorOffset = preRange.toString().length;

    const focusRange = document.createRange();
    focusRange.selectNodeContents(captionRef.current);
    focusRange.setEnd(selection.focusNode!, selection.focusOffset);
    const focusOffset = focusRange.toString().length;

    const start = Math.min(anchorOffset, focusOffset);
    const end = Math.max(anchorOffset, focusOffset);
    if (start === end) return;

    setHighlights((prev) =>
      [...prev, { id: crypto.randomUUID(), start, end, comment: "" }].sort(
        (a, b) => a.start - b.start,
      ),
    );
    selection.removeAllRanges();
  }

  function removeHighlight(id: string) {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  }

  function updateHighlightComment(id: string, comment: string) {
    setHighlights((prev) => prev.map((h) => (h.id === id ? { ...h, comment } : h)));
  }

  const segments: { text: string; highlightIndex: number | null }[] = [];
  let cursor = 0;
  highlights.forEach((h, i) => {
    if (h.start > cursor) segments.push({ text: caption.slice(cursor, h.start), highlightIndex: null });
    segments.push({ text: caption.slice(h.start, h.end), highlightIndex: i });
    cursor = Math.max(cursor, h.end);
  });
  if (cursor < caption.length) segments.push({ text: caption.slice(cursor), highlightIndex: null });

  async function handleApprove() {
    setError(null);
    setSubmitting("approve");
    try {
      await approvePost(postId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível aprovar.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleRequestAdjustment() {
    setError(null);
    setSubmitting("adjust");
    try {
      await requestAdjustment({
        postId,
        generalComment,
        highlights: highlights.map((h) => ({
          start: h.start,
          end: h.end,
          text: caption.slice(h.start, h.end),
          comment: h.comment,
        })),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o ajuste.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <article className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-center">
      <PostMockup
        type={type}
        caption={caption}
        scheduledDate={scheduledDate}
        media={media}
        clientName={clientName}
        logoUrl={logoUrl}
        accentColor={accentColor}
      />

      <div className="w-full max-w-md flex-1 space-y-3 rounded-lg border border-neutral-200 bg-white p-4 lg:max-w-lg">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
            Legenda
          </p>
          <p
            ref={captionRef}
            onMouseUp={handleCaptionMouseUp}
            className="cursor-text rounded-md border border-neutral-100 bg-fox-cream/60 p-3 text-sm leading-relaxed whitespace-pre-wrap select-text"
          >
            {segments.map((seg, i) =>
              seg.highlightIndex !== null ? (
                <mark key={i} className="rounded-sm bg-[#faff00] px-0.5">
                  {seg.text}
                  <sup className="ml-0.5 text-[10px] font-bold">{seg.highlightIndex + 1}</sup>
                </mark>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )}
          </p>
          <p className="text-xs text-neutral-400">
            Selecione quantos trechos quiser para pedir ajuste neles
          </p>
        </div>

        {highlights.length > 0 && (
          <div className="space-y-2">
            {highlights.map((h, i) => (
              <div key={h.id} className="rounded-md border border-neutral-200 bg-fox-cream p-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium">
                    Trecho {i + 1}:{" "}
                    <mark className="rounded-sm bg-[#faff00] px-0.5">
                      {caption.slice(h.start, h.end)}
                    </mark>
                  </p>
                  <button
                    type="button"
                    onClick={() => removeHighlight(h.id)}
                    className="flex-shrink-0 text-xs text-neutral-500 hover:text-neutral-900"
                  >
                    remover
                  </button>
                </div>
                <textarea
                  value={h.comment}
                  onChange={(e) => updateHighlightComment(h.id, e.target.value)}
                  rows={2}
                  placeholder="O que precisa mudar nesse trecho?"
                  className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm"
                />
              </div>
            ))}
          </div>
        )}

        {scheduledDate && <p className="text-xs text-neutral-500">Agendado para {scheduledDate}</p>}

        <textarea
          value={generalComment}
          onChange={(e) => setGeneralComment(e.target.value)}
          rows={2}
          placeholder={
            highlights.length > 0
              ? "Comentário geral (opcional)"
              : "Comentário (obrigatório para pedir ajuste)"
          }
          className="w-full rounded-md border border-neutral-300 bg-fox-cream px-3 py-2 text-sm"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleApprove}
            disabled={submitting !== null}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-60"
          >
            <CheckIcon />
            {submitting === "approve" ? "Aprovando..." : "Aprovar"}
          </button>
          <button
            type="button"
            onClick={handleRequestAdjustment}
            disabled={submitting !== null}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-fox-cream disabled:opacity-60"
          >
            <EditIcon />
            {submitting === "adjust" ? "Enviando..." : "Pedir ajuste"}
          </button>
        </div>
      </div>
    </article>
  );
}
