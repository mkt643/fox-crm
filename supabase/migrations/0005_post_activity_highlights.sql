-- Guarda os trechos grifados pelo cliente de forma estruturada (posição +
-- texto + comentário específico), para a agência conseguir visualizar os
-- grifos exatamente como o cliente marcou, não só como texto corrido.

alter table public.post_activity
  add column highlighted_ranges jsonb not null default '[]'::jsonb;
