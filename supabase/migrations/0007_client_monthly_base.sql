-- Valor mensal fixo do contrato (base), usado junto com os serviços extras
-- do mês para estimar o valor da próxima fatura no Financeiro do cliente.
alter table public.clients
  add column monthly_base_cents int;
