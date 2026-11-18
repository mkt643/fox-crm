-- Comercial: CRM de prospecção da própria agência (leads, metas, histórico, scripts).
-- Assim como o financeiro interno, tudo aqui é visível só pra agência (is_agency()).

create table public.commercial_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  profession text,
  profile_link text,
  whatsapp text,
  origin text,
  entry_date date not null default current_date,
  status text not null default 'abordar',
  -- 'abordar' | 'enviar' | 'abordado' | 'followup' | 'agendada' | 'realizada' | 'fechado' | 'arquivado'
  next_action_date date,
  potential_value_cents int,
  temperature text, -- null | 'frio' | 'morno' | 'quente'
  notes text,
  created_at timestamptz not null default now()
);

create index commercial_leads_status_idx on public.commercial_leads (status);
alter table public.commercial_leads enable row level security;
create policy "commercial_leads: agency only"
  on public.commercial_leads for all
  using (public.is_agency()) with check (public.is_agency());

create table public.commercial_lead_actions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.commercial_leads (id) on delete cascade,
  action_type text not null,
  action_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index commercial_lead_actions_lead_id_idx on public.commercial_lead_actions (lead_id);
alter table public.commercial_lead_actions enable row level security;
create policy "commercial_lead_actions: agency only"
  on public.commercial_lead_actions for all
  using (public.is_agency()) with check (public.is_agency());

create table public.commercial_goals (
  id uuid primary key default gen_random_uuid(),
  month text not null unique, -- 'YYYY-MM'
  avg_ticket_cents int,
  revenue_goal_cents int,
  rate_source text not null default 'estimativa', -- 'estimativa' | 'historico'
  estimate_lead_to_meeting_pct numeric not null default 10,
  estimate_meeting_to_contract_pct numeric not null default 20,
  created_at timestamptz not null default now()
);

alter table public.commercial_goals enable row level security;
create policy "commercial_goals: agency only"
  on public.commercial_goals for all
  using (public.is_agency()) with check (public.is_agency());

create table public.commercial_scripts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  objective text,
  category text not null, -- 'abordagem_inicial' | 'follow_up' | 'quebra_objecao' | 'agendamento' | 'pos_reuniao' | 'recuperacao_lead' | 'fechamento'
  journey_moment text,
  body text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.commercial_scripts enable row level security;
create policy "commercial_scripts: agency only"
  on public.commercial_scripts for all
  using (public.is_agency()) with check (public.is_agency());
