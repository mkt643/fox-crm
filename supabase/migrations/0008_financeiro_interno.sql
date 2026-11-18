-- Financeiro interno da agência (comercial/P&L da própria FOX, não dos clientes).
-- Tudo aqui é visível só para a agência (is_agency()) — nunca para o portal do cliente.

create table public.internal_billing_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text,
  document text, -- CNPJ ou CPF
  phone text,
  email text,
  profession text,
  status text not null default 'ativo', -- 'ativo' | 'inativo'
  address text,
  social_links jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.internal_billing_clients enable row level security;
create policy "internal_billing_clients: agency only"
  on public.internal_billing_clients for all
  using (public.is_agency()) with check (public.is_agency());

-- Receitas: pontuais (uma data só) ou recorrentes (dia fixo do mês, com início/fim opcional)
create table public.internal_revenues (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.internal_billing_clients (id) on delete cascade,
  kind text not null, -- 'pontual' | 'recorrente'
  description text,
  amount_cents int not null,
  due_date date, -- usado quando kind = 'pontual'
  start_date date, -- usado quando kind = 'recorrente'
  contract_end_date date, -- opcional, usado quando kind = 'recorrente'
  payment_day int, -- dia do mês (1-31), usado quando kind = 'recorrente'
  status text not null default 'pendente', -- 'pendente' | 'pago' | 'cancelado' (só vale direto para 'pontual')
  created_at timestamptz not null default now()
);

create index internal_revenues_client_id_idx on public.internal_revenues (client_id);
alter table public.internal_revenues enable row level security;
create policy "internal_revenues: agency only"
  on public.internal_revenues for all
  using (public.is_agency()) with check (public.is_agency());

-- Status mês a mês das receitas recorrentes (uma linha por mês em que foi marcada paga/cancelada)
create table public.internal_revenue_receipts (
  id uuid primary key default gen_random_uuid(),
  revenue_id uuid not null references public.internal_revenues (id) on delete cascade,
  month text not null, -- 'YYYY-MM'
  status text not null default 'pago', -- 'pago' | 'cancelado'
  paid_at timestamptz,
  unique (revenue_id, month)
);

alter table public.internal_revenue_receipts enable row level security;
create policy "internal_revenue_receipts: agency only"
  on public.internal_revenue_receipts for all
  using (public.is_agency()) with check (public.is_agency());

create table public.internal_suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.internal_suppliers enable row level security;
create policy "internal_suppliers: agency only"
  on public.internal_suppliers for all
  using (public.is_agency()) with check (public.is_agency());

-- Custos: fixos (recorrentes, repetem todo mês) ou pontuais
create table public.internal_costs (
  id uuid primary key default gen_random_uuid(),
  kind text not null, -- 'fixo' | 'pontual'
  description text not null,
  supplier_id uuid references public.internal_suppliers (id) on delete set null,
  nature text not null default 'operacao', -- 'fornecedor' | 'operacao'
  payment_method text, -- 'pix' | 'cartao' | 'boleto' | null
  related_client_id uuid references public.internal_billing_clients (id) on delete set null, -- null = "Minha empresa"
  due_date date, -- usado quando kind = 'pontual'
  start_date date, -- usado quando kind = 'fixo'
  end_date date, -- opcional, usado quando kind = 'fixo'
  payment_day int, -- dia do mês (1-31), usado quando kind = 'fixo'
  amount_cents int not null,
  status text not null default 'pendente', -- 'pendente' | 'pago' | 'cancelado' (só vale direto para 'pontual')
  created_at timestamptz not null default now()
);

create index internal_costs_supplier_id_idx on public.internal_costs (supplier_id);
alter table public.internal_costs enable row level security;
create policy "internal_costs: agency only"
  on public.internal_costs for all
  using (public.is_agency()) with check (public.is_agency());

create table public.internal_cost_receipts (
  id uuid primary key default gen_random_uuid(),
  cost_id uuid not null references public.internal_costs (id) on delete cascade,
  month text not null,
  status text not null default 'pago',
  paid_at timestamptz,
  unique (cost_id, month)
);

alter table public.internal_cost_receipts enable row level security;
create policy "internal_cost_receipts: agency only"
  on public.internal_cost_receipts for all
  using (public.is_agency()) with check (public.is_agency());

-- Configurações globais do financeiro interno (uma linha só)
create table public.internal_financial_settings (
  id boolean primary key default true,
  tax_rate_pct numeric not null default 6,
  reserve_pct numeric not null default 20,
  reserve_current_cents int not null default 0,
  constraint internal_financial_settings_singleton check (id)
);

insert into public.internal_financial_settings (id) values (true);

alter table public.internal_financial_settings enable row level security;
create policy "internal_financial_settings: agency only"
  on public.internal_financial_settings for all
  using (public.is_agency()) with check (public.is_agency());
