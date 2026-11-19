-- Guia de marca completo por cliente: identidade visual, brief, e documento de
-- estratégia (Entender / Definir / Converter / Produzir), além de um FAQ global
-- sobre regras de publicidade médica. Tudo com o mesmo padrão de RLS já usado
-- no resto do app: agência tem acesso total, cliente só lê o que é dele.

create table public.brand_identity (
  client_id uuid primary key references public.clients (id) on delete cascade,
  tagline text,
  color_meta jsonb not null default '{}'::jsonb,
  -- color_meta shape: { primary: {name, usage}, secondary: {...}, accent: {...}, light: {...} }
  logo_use_rules text,
  logo_avoid_rules text,
  typography_heading text,
  typography_body text,
  photo_dos text,
  photo_donts text,
  updated_at timestamptz not null default now()
);

alter table public.brand_identity enable row level security;
create policy "brand_identity: agency full access"
  on public.brand_identity for all
  using (public.is_agency()) with check (public.is_agency());
create policy "brand_identity: client reads own"
  on public.brand_identity for select
  using (client_id = public.current_client_id());

create table public.brand_brief (
  client_id uuid primary key references public.clients (id) on delete cascade,
  products_services text,
  differentiator text,
  raw_materials text,
  brand_history text,
  audience_voice text,
  common_questions text,
  media_notes text,
  updated_at timestamptz not null default now()
);

alter table public.brand_brief enable row level security;
create policy "brand_brief: agency full access"
  on public.brand_brief for all
  using (public.is_agency()) with check (public.is_agency());
create policy "brand_brief: client reads own"
  on public.brand_brief for select
  using (client_id = public.current_client_id());

create table public.brand_strategy (
  client_id uuid primary key references public.clients (id) on delete cascade,
  positioning text,
  differentiation text,
  competition text,
  personality_traits jsonb not null default '[]'::jsonb,
  -- [{ trait, is, isnot }]
  tone_dos text,
  tone_donts text,
  always_text text,
  never_text text,
  updated_at timestamptz not null default now()
);

alter table public.brand_strategy enable row level security;
create policy "brand_strategy: agency full access"
  on public.brand_strategy for all
  using (public.is_agency()) with check (public.is_agency());
create policy "brand_strategy: client reads own"
  on public.brand_strategy for select
  using (client_id = public.current_client_id());

create table public.brand_awareness_stages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  stage_label text not null,
  what_audience_thinks text,
  what_brand_shows text,
  position int not null default 0
);

create index brand_awareness_stages_client_id_idx on public.brand_awareness_stages (client_id);
alter table public.brand_awareness_stages enable row level security;
create policy "brand_awareness_stages: agency full access"
  on public.brand_awareness_stages for all
  using (public.is_agency()) with check (public.is_agency());
create policy "brand_awareness_stages: client reads own"
  on public.brand_awareness_stages for select
  using (client_id = public.current_client_id());

create table public.brand_editorial_pillars (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  percentage int,
  description text,
  position int not null default 0
);

create index brand_editorial_pillars_client_id_idx on public.brand_editorial_pillars (client_id);
alter table public.brand_editorial_pillars enable row level security;
create policy "brand_editorial_pillars: agency full access"
  on public.brand_editorial_pillars for all
  using (public.is_agency()) with check (public.is_agency());
create policy "brand_editorial_pillars: client reads own"
  on public.brand_editorial_pillars for select
  using (client_id = public.current_client_id());

create table public.brand_channels (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  channel text not null,
  frequency text,
  format text,
  position int not null default 0
);

create index brand_channels_client_id_idx on public.brand_channels (client_id);
alter table public.brand_channels enable row level security;
create policy "brand_channels: agency full access"
  on public.brand_channels for all
  using (public.is_agency()) with check (public.is_agency());
create policy "brand_channels: client reads own"
  on public.brand_channels for select
  using (client_id = public.current_client_id());

create table public.brand_journey_steps (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  step_name text not null,
  description text,
  position int not null default 0
);

create index brand_journey_steps_client_id_idx on public.brand_journey_steps (client_id);
alter table public.brand_journey_steps enable row level security;
create policy "brand_journey_steps: agency full access"
  on public.brand_journey_steps for all
  using (public.is_agency()) with check (public.is_agency());
create policy "brand_journey_steps: client reads own"
  on public.brand_journey_steps for select
  using (client_id = public.current_client_id());

create table public.brand_funnel_stages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  stage_name text not null,
  description text,
  position int not null default 0
);

create index brand_funnel_stages_client_id_idx on public.brand_funnel_stages (client_id);
alter table public.brand_funnel_stages enable row level security;
create policy "brand_funnel_stages: agency full access"
  on public.brand_funnel_stages for all
  using (public.is_agency()) with check (public.is_agency());
create policy "brand_funnel_stages: client reads own"
  on public.brand_funnel_stages for select
  using (client_id = public.current_client_id());

-- FAQ global sobre regras de publicidade médica (Resolução CFM 2.336/2023 etc).
-- Não é por cliente: a agência mantém uma lista só, visível a todos os clientes.
create table public.medical_ads_faq (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.medical_ads_faq enable row level security;
create policy "medical_ads_faq: agency full access"
  on public.medical_ads_faq for all
  using (public.is_agency()) with check (public.is_agency());
create policy "medical_ads_faq: any logged in user can read"
  on public.medical_ads_faq for select
  using (auth.uid() is not null);
