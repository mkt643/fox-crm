-- Importa os clientes, mensalidades e custos fixos já existentes no sistema de gestão
-- comercial usado anteriormente, para começar o Financeiro interno com os dados reais.
-- Datas de início são aproximadas (não visíveis na origem) — o dia de cobrança é o real.

insert into public.internal_financial_settings (id, tax_rate_pct, reserve_pct, reserve_current_cents)
values (true, 6, 20, 0)
on conflict (id) do update set tax_rate_pct = 6, reserve_pct = 20;

with novos_clientes as (
  insert into public.internal_billing_clients (name)
  values
    ('Diego Gaspar'),
    ('Dra. Vanessa Sorondo'),
    ('Dra. Adriane Castagno'),
    ('Dra. Celene Longo'),
    ('Dra. Najila Salameh'),
    ('Dra. Izadora Fonseca'),
    ('Dra. Betina Artus'),
    ('Dra. Natália Saretta'),
    ('Dra. Fernanda Laranjeira'),
    ('Dr. José Bordin'),
    ('Lótus'),
    ('Dra. Laura Roehe'),
    ('Dra. Rosane Cotta'),
    ('Dra. Rafaela Mezzomo + Clínica Mezzomo'),
    ('Dra. Isabela Lima'),
    ('Psi Luciana Bezerra'),
    ('Matrecare'),
    ('Dra. Aline Scherer')
  returning id, name
)
insert into public.internal_revenues (client_id, kind, description, amount_cents, start_date, payment_day, status)
select id, 'recorrente', 'Mensalidade', amount_cents, '2026-01-01'::date, payment_day, 'pendente'
from novos_clientes
join (values
    ('Diego Gaspar', 15000, 1),
    ('Dra. Vanessa Sorondo', 60000, 2),
    ('Dra. Adriane Castagno', 60000, 5),
    ('Dra. Celene Longo', 120000, 5),
    ('Dra. Najila Salameh', 80000, 5),
    ('Dra. Izadora Fonseca', 175000, 5),
    ('Dra. Betina Artus', 60000, 5),
    ('Dra. Natália Saretta', 140000, 14),
    ('Dra. Fernanda Laranjeira', 80000, 15),
    ('Dr. José Bordin', 80000, 15),
    ('Lótus', 20000, 15),
    ('Dra. Laura Roehe', 145800, 15),
    ('Dra. Rosane Cotta', 120000, 15),
    ('Dra. Rafaela Mezzomo + Clínica Mezzomo', 20000, 15),
    ('Dra. Isabela Lima', 150000, 20),
    ('Psi Luciana Bezerra', 80000, 20),
    ('Matrecare', 70000, 21),
    ('Dra. Aline Scherer', 35000, 28)
  ) as dados(name, amount_cents, payment_day)
  on dados.name = novos_clientes.name;

insert into public.internal_costs (kind, description, nature, start_date, payment_day, amount_cents, status)
values
  ('fixo', 'Hostgator (hospedagem de sites)', 'operacao', '2026-01-01', 6, 5600, 'pendente'),
  ('fixo', 'Claude', 'operacao', '2026-01-01', 10, 12000, 'pendente'),
  ('fixo', 'Contador', 'operacao', '2026-01-01', 10, 40000, 'pendente'),
  ('fixo', 'Captions', 'operacao', '2026-01-01', 22, 6000, 'pendente'),
  ('fixo', 'Meta verified standard', 'operacao', '2026-01-01', 23, 5400, 'pendente'),
  ('fixo', 'Capcut', 'operacao', '2026-01-01', 25, 6600, 'pendente');
