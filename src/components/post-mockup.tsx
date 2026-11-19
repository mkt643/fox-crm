"use client";

import { useState } from "react";

type Media = { id: string; url?: string; kind: string };

function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 11.5a8.4 8.4 0 0 1-8.8 8.4 9 9 0 0 1-3.3-.6L3 21l1.7-5a8.3 8.3 0 0 1-.7-3.4 8.4 8.4 0 0 1 8.4-8.4 8.4 8.4 0 0 1 8.6 8.3Z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function PostMockup({
  type,
  caption,
  scheduledDate,
  media,
  clientName,
  logoUrl,
  accentColor,
}: {
  type: string;
  caption: string;
  scheduledDate: string | null;
  media: Media[];
  clientName: string;
  logoUrl?: string;
  accentColor: string;
}) {
  const [index, setIndex] = useState(0);
  const current = media[Math.min(index, Math.max(media.length - 1, 0))];

  const phoneAspect = type === "reels" ? "aspect-[9/16]" : "aspect-[4/5]";
  const previewCaption = caption.length > 70 ? `${caption.slice(0, 70)}...` : caption;
  const dateLabel = scheduledDate
    ? new Date(scheduledDate + "T00:00:00").toLocaleDateString("pt-BR")
    : "sem data";

  return (
    <div className="w-full flex-shrink-0 space-y-3 lg:w-[280px]">
      <div className="mx-auto w-full max-w-[280px] rounded-[2.2rem] border-[6px] border-neutral-900 bg-neutral-900 shadow-lg">
        <div className="relative overflow-hidden rounded-[1.7rem] bg-white">
          <div className="absolute top-2 left-1/2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-neutral-300" />

          <div className="flex items-center gap-2 px-3 pt-6 pb-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={clientName}
                className="h-7 w-7 flex-shrink-0 rounded-full border border-neutral-200 bg-white object-contain p-0.5"
              />
            ) : (
              <span
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: accentColor }}
              >
                {clientName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="truncate text-xs font-semibold">{clientName}</span>
          </div>

          <div className={`relative overflow-hidden bg-black ${phoneAspect}`}>
            {current?.kind === "video" ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={current.url} controls className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current?.url} alt="" className="h-full w-full object-cover" />
            )}

            {media.length > 1 && (
              <>
                <span className="absolute top-2 right-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white/90">
                  {index + 1}/{media.length}
                </span>

                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => setIndex((i) => Math.max(i - 1, 0))}
                    aria-label="Imagem anterior"
                    className="absolute top-1/2 left-1.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/30 text-white backdrop-blur-sm transition hover:bg-white/50"
                  >
                    <ChevronLeft />
                  </button>
                )}
                {index < media.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setIndex((i) => Math.min(i + 1, media.length - 1))}
                    aria-label="Próxima imagem"
                    className="absolute top-1/2 right-1.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/30 text-white backdrop-blur-sm transition hover:bg-white/50"
                  >
                    <ChevronRight />
                  </button>
                )}

                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                  {media.map((m, i) => (
                    <span
                      key={m.id}
                      className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-3 text-neutral-900">
              <HeartIcon />
              <CommentIcon />
              <SendIcon />
            </div>
            <BookmarkIcon />
          </div>

          <div className="space-y-0.5 px-3 pb-3">
            <p className="text-xs leading-snug">
              <span className="font-semibold">{clientName}</span> {previewCaption || "Sem legenda"}
            </p>
            <p className="text-[10px] tracking-wide text-neutral-400 uppercase">{dateLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
