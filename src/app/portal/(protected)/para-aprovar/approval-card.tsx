"use client";

import { useRef, useState } from "react";
import { approvePost, requestAdjustment } from "./actions";

type Media = { id: string; url?: string; kind: string };

export function ApprovalCard({
  postId,
  caption,
  scheduledDate,
  media,
}: {
  postId: string;
  caption: string;
  scheduledDate: string | null;
  media: Media[];
}) {
  const captionRef = useRef<HTMLParagraphElement>(null);
  const [highlight, setHighlight] = useState<{ start: number; end: number } | null>(null);

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

    setHighlight({ start, end });
    selection.removeAllRanges();
  }

  const highlightedText = highlight ? caption.slice(highlight.start, highlight.end) : "";

  const segments = highlight
    ? [
        { text: caption.slice(0, highlight.start), marked: false },
        { text: caption.slice(highlight.start, highlight.end), marked: true },
        { text: caption.slice(highlight.end), marked: false },
      ]
    : [{ text: caption, marked: false }];

  return (
    <article className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="aspect-[4/5] bg-black">
        {media[0]?.kind === "video" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={media[0].url} controls className="h-full w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media[0]?.url} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      {media.length > 1 && (
        <div className="flex gap-1 overflow-x-auto p-2">
          {media.map((m) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={m.id}
              src={m.url}
              alt=""
              className="h-14 w-14 flex-shrink-0 rounded object-cover opacity-70"
            />
          ))}
        </div>
      )}
      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <p
            ref={captionRef}
            onMouseUp={handleCaptionMouseUp}
            className="cursor-text select-text whitespace-pre-wrap text-sm"
          >
            {segments.map((seg, i) =>
              seg.marked ? (
                <mark key={i} className="rounded-sm bg-[#faff00] px-0.5">
                  {seg.text}
                </mark>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )}
          </p>
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Selecione um trecho da legenda para pedir ajuste nele</span>
            {highlight && (
              <button
                type="button"
                onClick={() => setHighlight(null)}
                className="text-neutral-500 underline hover:text-neutral-900"
              >
                remover grifo
              </button>
            )}
          </div>
        </div>

        {scheduledDate && <p className="text-xs text-neutral-500">Agendado para {scheduledDate}</p>}

        <form className="space-y-2">
          <input type="hidden" name="post_id" value={postId} />
          <input type="hidden" name="highlighted_text" value={highlightedText} />
          <textarea
            name="comment"
            rows={2}
            placeholder="Comentário (obrigatório para pedir ajuste)"
            className="w-full rounded-md border border-neutral-300 bg-fox-cream px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              formAction={approvePost}
              className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
            >
              Aprovar
            </button>
            <button
              type="submit"
              formAction={requestAdjustment}
              className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-fox-cream"
            >
              Pedir ajuste
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}
