-- Troca o conteúdo único de "Como funciona" por uma lista de perguntas e
-- respostas (acordeão), editável pela agência e lida por qualquer usuário
-- autenticado.

create table public.how_it_works_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.how_it_works_items enable row level security;

create policy "how_it_works_items: agency full access"
  on public.how_it_works_items for all
  using (public.is_agency())
  with check (public.is_agency());

create policy "how_it_works_items: authenticated read"
  on public.how_it_works_items for select
  using (auth.uid() is not null);

insert into public.how_it_works_items (question, answer, position) values
  ('O que é uma pauta?', 'É a ideia inicial de uma publicação: o tema, o formato e a mensagem principal. A gente alinha a pauta com você antes de produzir a arte.', 0),
  ('O que são os posts do feed?', 'São as publicações que ficam permanentemente no seu perfil: imagens, carrosséis e vídeos.', 1),
  ('Qual a diferença entre feed, stories e reels?', 'Feed fica salvo no perfil, Stories somem em 24h, e Reels são vídeos curtos focados em alcance. Cada formato tem um objetivo diferente na estratégia.', 2),
  ('Como funciona a aprovação?', 'Antes de publicar, enviamos o material para você revisar aqui no portal. Você aprova ou pede ajuste explicando o que precisa mudar.', 3),
  ('O que acontece depois que um conteúdo é aprovado?', 'Programamos a publicação para a data combinada. Você pode acompanhar tudo pelo Calendário.', 4),
  ('O que esperar em cada fase do projeto?', 'Veja a aba Projeto para acompanhar as etapas em andamento e o que falta para cada uma.', 5);

drop table if exists public.how_it_works_content;
