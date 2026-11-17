# Setup — FOX (passos manuais)

Estes passos precisam ser feitos por você (criação de contas), porque dependem
do seu login/e-mail. Depois de cada um, me avise ou cole as chaves pedidas e eu
sigo com a configuração do código.

## 1. Supabase
1. Crie uma conta em https://supabase.com e um novo projeto (ex: `fox-crm`).
2. Em **Settings > API**, copie:
   - `Project URL` → vai em `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → vai em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → vai em `SUPABASE_SERVICE_ROLE_KEY` (nunca expor no
     front-end; só usada em rotas de servidor)
3. Copie `.env.local.example` para `.env.local` e cole os valores.

## 2. Resend (e-mails de notificação)
1. Crie uma conta em https://resend.com.
2. Verifique um domínio de envio (ou use o domínio de teste do Resend
   enquanto não configurarmos um domínio próprio).
3. Gere uma API key e cole em `RESEND_API_KEY` no `.env.local`.
4. Defina `RESEND_FROM_EMAIL` (ex: `FOX <naoresponda@seudominio.com>`).

## 3. Vercel
1. Crie uma conta em https://vercel.com.
2. Crie um repositório no GitHub com este projeto (eu posso preparar o
   `git push` quando você tiver o repositório criado e me passar a URL).
3. No painel da Vercel, importe esse repositório e, em
   **Settings > Environment Variables**, cadastre as mesmas variáveis do
   `.env.local`.

## 4. Domínio (opcional por agora)
Pode começar com o domínio gratuito `*.vercel.app`. Quando quiser usar um
domínio próprio (ex: `portal.fox.com.br`), me avise para configurarmos o DNS.

---
Depois que Supabase e Resend estiverem criados e as chaves no `.env.local`,
sigo para a Fase 1 (modelagem do banco de dados).
