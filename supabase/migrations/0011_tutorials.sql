-- Biblioteca de tutoriais (vídeo ou documento) que a agência disponibiliza para os clientes.
create table public.tutorials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kind text not null, -- 'video' | 'documento'
  url text, -- link do vídeo (YouTube, Loom, etc.), usado quando kind = 'video'
  storage_path text, -- usado quando kind = 'documento'
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.tutorials enable row level security;

create policy "tutorials: agency full access"
  on public.tutorials for all
  using (public.is_agency()) with check (public.is_agency());

create policy "tutorials: any logged in user can read"
  on public.tutorials for select
  using (auth.uid() is not null);

insert into storage.buckets (id, name, public)
values ('tutorials', 'tutorials', false)
on conflict (id) do nothing;

create policy "tutorials bucket: agency full access"
  on storage.objects for all
  using (bucket_id = 'tutorials' and public.is_agency())
  with check (bucket_id = 'tutorials' and public.is_agency());

create policy "tutorials bucket: any logged in user can read"
  on storage.objects for select
  using (bucket_id = 'tutorials' and auth.uid() is not null);
