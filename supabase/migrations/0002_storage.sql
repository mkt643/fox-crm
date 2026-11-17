-- Buckets de Storage
-- Convenção de path: sempre "<client_id>/..." no início do nome do arquivo,
-- para as policies conseguirem restringir o cliente à própria pasta.

insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', false)
on conflict (id) do nothing;

create policy "post-media: agency full access"
  on storage.objects for all
  using (bucket_id = 'post-media' and public.is_agency())
  with check (bucket_id = 'post-media' and public.is_agency());

create policy "post-media: client reads own folder"
  on storage.objects for select
  using (
    bucket_id = 'post-media'
    and public.current_client_id() is not null
    and (storage.foldername(name))[1] = public.current_client_id()::text
  );

create policy "brand-assets: agency full access"
  on storage.objects for all
  using (bucket_id = 'brand-assets' and public.is_agency())
  with check (bucket_id = 'brand-assets' and public.is_agency());

create policy "brand-assets: client reads own folder"
  on storage.objects for select
  using (
    bucket_id = 'brand-assets'
    and public.current_client_id() is not null
    and (storage.foldername(name))[1] = public.current_client_id()::text
  );
