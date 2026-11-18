-- Contrato (documentos fixos: contrato assinado, proposta comercial)
create table public.client_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  type text not null, -- 'contrato' | 'proposta' | 'outro'
  label text not null,
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);

create index client_documents_client_id_idx on public.client_documents (client_id);
alter table public.client_documents enable row level security;

create policy "client_documents: agency full access"
  on public.client_documents for all
  using (public.is_agency()) with check (public.is_agency());

create policy "client_documents: client reads own"
  on public.client_documents for select
  using (client_id = public.current_client_id());

-- Financeiro: pagamentos / faturas
create type public.invoice_status as enum ('pendente', 'pago', 'atrasado', 'cancelado');

create table public.client_invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  description text not null,
  amount_cents int not null,
  due_date date,
  status public.invoice_status not null default 'pendente',
  pix_code text,
  boleto_path text,
  invoice_path text, -- nota fiscal
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index client_invoices_client_id_idx on public.client_invoices (client_id);
alter table public.client_invoices enable row level security;

create policy "client_invoices: agency full access"
  on public.client_invoices for all
  using (public.is_agency()) with check (public.is_agency());

create policy "client_invoices: client reads own"
  on public.client_invoices for select
  using (client_id = public.current_client_id());

-- Serviços contratados (inclusos no plano) e extras (upsell, cobrados por uso)
create table public.client_services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  category text not null, -- 'contratado' | 'extra'
  label text not null,
  unit_price_cents int, -- só usado para 'extra'; agência define depois
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index client_services_client_id_idx on public.client_services (client_id);
alter table public.client_services enable row level security;

create policy "client_services: agency full access"
  on public.client_services for all
  using (public.is_agency()) with check (public.is_agency());

create policy "client_services: client reads own"
  on public.client_services for select
  using (client_id = public.current_client_id());

-- Uso mensal dos serviços extras (para estimar a próxima fatura)
create table public.client_service_usage (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  service_id uuid not null references public.client_services (id) on delete cascade,
  month text not null, -- 'YYYY-MM'
  quantity int not null default 1,
  created_at timestamptz not null default now()
);

create index client_service_usage_client_id_idx on public.client_service_usage (client_id);
create index client_service_usage_month_idx on public.client_service_usage (month);
alter table public.client_service_usage enable row level security;

create policy "client_service_usage: agency full access"
  on public.client_service_usage for all
  using (public.is_agency()) with check (public.is_agency());

create policy "client_service_usage: client reads own"
  on public.client_service_usage for select
  using (client_id = public.current_client_id());

-- Storage bucket para contratos, boletos e notas fiscais
insert into storage.buckets (id, name, public)
values ('client-documents', 'client-documents', false)
on conflict (id) do nothing;

create policy "client-documents: agency full access"
  on storage.objects for all
  using (bucket_id = 'client-documents' and public.is_agency())
  with check (bucket_id = 'client-documents' and public.is_agency());

create policy "client-documents: client reads own folder"
  on storage.objects for select
  using (
    bucket_id = 'client-documents'
    and public.current_client_id() is not null
    and (storage.foldername(name))[1] = public.current_client_id()::text
  );
