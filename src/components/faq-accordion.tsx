"use client";

import { useState } from "react";
import Link from "next/link";

const FAQ_ITEMS = [
  {
    question: "O que é uma pauta?",
    answer:
      "É o planejamento dos temas e formatos de conteúdo do mês, definido junto com a estratégia do seu perfil.",
  },
  {
    question: "O que são os posts do feed?",
    answer: "São as publicações fixas que ficam no seu perfil — imagens, carrosséis e reels.",
  },
  {
    question: "Diferença entre feed, stories e reels",
    answer:
      "Feed são publicações permanentes no perfil; stories somem em 24h; reels são vídeos curtos focados em alcance.",
  },
  {
    question: "Como funciona a aprovação?",
    answer:
      "Cada post passa por aqui antes de ir ao ar. Você pode aprovar direto ou grifar trechos da legenda pedindo ajuste.",
  },
  {
    question: "O que acontece depois que uma arte é aprovada?",
    answer: "Ela entra na fila de publicação e vai ao ar na data agendada, sem precisar de mais nada.",
  },
  {
    question: "O que esperar em cada fase?",
    answer:
      "Produção interna → aprovação com você → ajustes (se precisar) → publicação. Acompanhe tudo na linha do tempo do mês.",
  },
];

export function FaqAccordion({ accentColor }: { accentColor: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
      {FAQ_ITEMS.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full items-center justify-between gap-2 p-4 text-left text-sm font-medium hover:bg-fox-cream"
            >
              {item.question}
              <span
                className="flex-shrink-0 text-xs transition-transform"
                style={{ color: accentColor, transform: open ? "rotate(180deg)" : undefined }}
              >
                ▾
              </span>
            </button>
            {open && <p className="px-4 pb-4 text-xs text-neutral-500">{item.answer}</p>}
          </div>
        );
      })}
      <Link
        href="/portal/como-funciona"
        className="block p-4 text-center text-xs font-medium"
        style={{ color: accentColor }}
      >
        Ver tudo sobre como funciona ›
      </Link>
    </div>
  );
}
