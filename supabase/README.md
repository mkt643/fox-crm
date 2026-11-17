# Banco de dados — como aplicar

Por enquanto não estamos usando a Supabase CLI (evita precisar logar via
terminal). Aplique direto pelo **SQL Editor** do painel Supabase:

1. Abra o projeto no painel Supabase → menu **SQL Editor** → **New query**.
2. Cole o conteúdo de `supabase/migrations/0001_init.sql`, rode (▶ Run).
3. Abra uma nova query, cole `supabase/migrations/0002_storage.sql`, rode.
4. Confirme em **Table Editor** que as tabelas apareceram e em **Storage**
   que os buckets `post-media` e `brand-assets` foram criados.

## Criar o primeiro usuário da agência

A tabela `agency_members` referencia o id do usuário no Supabase Auth, então
o usuário de autenticação precisa existir primeiro:

1. No painel: **Authentication → Users → Add user** → crie com seu e-mail e
   uma senha (desmarque "Auto confirm user" não é necessário, pode deixar
   confirmado).
2. Copie o **UUID** desse usuário (coluna `UID` na lista de usuários).
3. No **SQL Editor**, rode (troque os valores):

   ```sql
   insert into public.agency_members (id, name, email)
   values ('COLE-O-UUID-AQUI', 'Seu Nome', 'seu-email@agenciafoxmkt.com.br');
   ```

Repita esse processo para cada membro do time da agência que for ter acesso
ao painel.

## Criar o login de um cliente (teste)

O login do cliente também é um usuário do Supabase Auth, vinculado a uma
linha em `clients`:

1. **Authentication → Users → Add user** → crie com o e-mail que o cliente
   vai usar para entrar no portal.
2. Copie o UUID e rode no SQL Editor:

   ```sql
   insert into public.clients (auth_user_id, name)
   values ('COLE-O-UUID-AQUI', 'Nome da Clínica');
   ```

Isso vai ser automatizado pelo painel da agência na Fase 3 — por agora é
manual só para testarmos o login nas Fases 2–4.
