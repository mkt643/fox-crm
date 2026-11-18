-- Expande a identidade visual do cliente de 2 para 4 cores, para o portal
-- explorar melhor a paleta de cada cliente (nav, dashboard, destaques).

alter table public.clients
  add column accent_color text,
  add column light_color text;
