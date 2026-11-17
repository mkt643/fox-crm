-- FOX — schema inicial
-- Modelo de acesso:
--   * "agência": qualquer usuário com uma linha em agency_members. Acesso
--     total a todas as tabelas.
--   * "cliente": login único por cliente (clients.auth_user_id). Acesso de
--     LEITURA apenas às suas próprias linhas via RLS. Ações de escrita do
--     cliente (aprovar post, pedir ajuste, comentar) não passam pela anon
--     key — são feitas por Route Handlers do Next.js autenticados, que
--     validam a regra de negócio e gravam usando a service_role key. Isso
--     evita ter que modelar RLS coluna-a-coluna para o fluxo de aprovação.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.post_type as enum ('imagem', 'carrossel', 'reels');
create type public.post_status as enum (
  'revisao_interna',
  'com_cliente',
  'ajuste_pedido',
  'aprovado'
);
create type public.media_kind as enum ('image', 'video');
create type public.actor_type as enum ('agency', 'client');
create type public.stage_status as enum ('pendente', 'em_andamento', 'concluida');
create type public.pendency_status as enum ('pendente', 'resolvida');

-- ---------------------------------------------------------------------------
-- Pessoas
-- ---------------------------------------------------------------------------

-- Time da agência (cada membro tem seu próprio login Supabase Auth).
create table public.agency_members (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

-- Clientes da agência. auth_user_id é o login único e compartilhado do
-- cliente (decisão: uma conta por cliente, não por pessoa).
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  logo_path text,
  primary_color text,
  secondary_color text,
  active boolean not null default true,
  created_by uuid references public.agency_members (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Posts e fila de aprovação
-- ---------------------------------------------------------------------------

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  type public.post_type not null,
  caption text not null default '',
  scheduled_date date,
  status public.post_status not null default 'revisao_interna',
  created_by uuid references public.agency_members (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_client_id_idx on public.posts (client_id);
create index posts_status_idx on public.posts (status);

-- Mídia do post. Carrossel = várias linhas ordenadas por "position".
create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  storage_path text not null,
  kind public.media_kind not null,
  position int not null default 0
);

create index post_media_post_id_idx on public.post_media (post_id);

-- Histórico de mudanças de status + comentários (ex: "Ajuste pedido: trocar
-- a foto da capa").
create table public.post_activity (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  actor_type public.actor_type not null,
  actor_agency_member_id uuid references public.agency_members (id),
  previous_status public.post_status,
  new_status public.post_status not null,
  comment text,
  created_at timestamptz not null default now()
);

create index post_activity_post_id_idx on public.post_activity (post_id);

-- ---------------------------------------------------------------------------
-- Marca, Estratégia, Projeto, Pendências (abas do portal do cliente)
-- ---------------------------------------------------------------------------

create table public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  label text not null,
  asset_type text not null, -- 'logo' | 'cores' | 'manual_marca' | 'fonte' | ...
  storage_path text,
  value text, -- ex: código hex de cor, nome de fonte
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index brand_assets_client_id_idx on public.brand_assets (client_id);

create table public.strategy_sections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  content text not null default '',
  position int not null default 0,
  updated_at timestamptz not null default now()
);

create index strategy_sections_client_id_idx on public.strategy_sections (client_id);

-- Linha do tempo do projeto, etapas personalizáveis por cliente.
create table public.project_stages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  description text,
  status public.stage_status not null default 'pendente',
  due_date date,
  position int not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index project_stages_client_id_idx on public.project_stages (client_id);

-- Pendências do cliente, personalizáveis por cliente.
create table public.client_pendencies (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  description text,
  status public.pendency_status not null default 'pendente',
  due_date date,
  created_by uuid references public.agency_members (id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index client_pendencies_client_id_idx on public.client_pendencies (client_id);

-- "Como funciona" é um conteúdo único e global (não varia por cliente).
create table public.how_it_works_content (
  id int primary key default 1 check (id = 1),
  content text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.how_it_works_content (id, content) values (1, '');

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clients_set_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger posts_set_updated_at before update on public.posts
  for each row execute function public.set_updated_at();
create trigger strategy_sections_set_updated_at before update on public.strategy_sections
  for each row execute function public.set_updated_at();
create trigger how_it_works_content_set_updated_at before update on public.how_it_works_content
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers de papel para RLS
-- ---------------------------------------------------------------------------

create or replace function public.is_agency()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.agency_members where id = auth.uid());
$$;

create or replace function public.current_client_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.clients where auth_user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.agency_members enable row level security;
alter table public.clients enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.post_activity enable row level security;
alter table public.brand_assets enable row level security;
alter table public.strategy_sections enable row level security;
alter table public.project_stages enable row level security;
alter table public.client_pendencies enable row level security;
alter table public.how_it_works_content enable row level security;

-- agency_members: agência vê e gerencia a si mesma; cliente não acessa.
create policy "agency_members: agency full access"
  on public.agency_members for all
  using (public.is_agency())
  with check (public.is_agency());

-- clients: agência tem acesso total; cliente só lê a própria linha.
create policy "clients: agency full access"
  on public.clients for all
  using (public.is_agency())
  with check (public.is_agency());

create policy "clients: client reads own row"
  on public.clients for select
  using (auth_user_id = auth.uid());

-- Tabelas client-scoped: agência tem acesso total; cliente só lê (SELECT)
-- linhas do próprio client_id. Escrita do cliente acontece via Route
-- Handler com service_role (ver comentário no topo do arquivo).
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'posts', 'post_media', 'post_activity', 'brand_assets',
    'strategy_sections', 'project_stages', 'client_pendencies'
  ])
  loop
    execute format(
      'create policy "%s: agency full access" on public.%I for all using (public.is_agency()) with check (public.is_agency());',
      t, t
    );
  end loop;
end $$;

create policy "posts: client reads own"
  on public.posts for select
  using (client_id = public.current_client_id());

create policy "post_media: client reads own"
  on public.post_media for select
  using (post_id in (select id from public.posts where client_id = public.current_client_id()));

create policy "post_activity: client reads own"
  on public.post_activity for select
  using (post_id in (select id from public.posts where client_id = public.current_client_id()));

create policy "brand_assets: client reads own"
  on public.brand_assets for select
  using (client_id = public.current_client_id());

create policy "strategy_sections: client reads own"
  on public.strategy_sections for select
  using (client_id = public.current_client_id());

create policy "project_stages: client reads own"
  on public.project_stages for select
  using (client_id = public.current_client_id());

create policy "client_pendencies: client reads own"
  on public.client_pendencies for select
  using (client_id = public.current_client_id());

-- how_it_works_content: agência edita, qualquer usuário autenticado lê.
create policy "how_it_works_content: agency full access"
  on public.how_it_works_content for all
  using (public.is_agency())
  with check (public.is_agency());

create policy "how_it_works_content: authenticated read"
  on public.how_it_works_content for select
  using (auth.uid() is not null);
