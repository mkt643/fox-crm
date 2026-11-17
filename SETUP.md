# Setup — FOX (passos manuais)

Estes passos precisam ser feitos por você (criação de contas), porque dependem
do seu login/e-mail. Depois de cada um, me avise ou cole as chaves pedidas e eu
sigo com a configuração do código.

## 1. Supabase ✅ feito
Projeto criado (`vlvtuygtvxhasgnppmwu`), chaves já estão no `.env.local`.

## 1.1. Ativar Auth por e-mail/senha
No painel Supabase, em **Authentication > Providers**, confirme que o
provider **Email** está habilitado (vem ligado por padrão). Vamos usar
e-mail/senha tanto para login da agência quanto do cliente — sem
confirmação por link de e-mail por enquanto, para simplificar o login
compartilhado por cliente.

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

## 4. Domínio — decidido: `portal.agenciafoxmkt.com.br`
Domínio registrado e hospedado na HostGator (site institucional continua lá).
Na Fase 6 (deploy), os passos serão:
1. Na Vercel: **Settings > Domains > Add** → `portal.agenciafoxmkt.com.br` →
   copiar o registro CNAME que a Vercel mostrar.
2. Na HostGator: **cPanel > Zone Editor** (ou "Gerenciar DNS") → adicionar um
   registro **CNAME** com nome `portal` apontando para o valor da Vercel.
3. Aguardar propagação do DNS (minutos a algumas horas) — a Vercel emite o
   certificado SSL automaticamente depois que o CNAME propagar.

---
Depois que Supabase e Resend estiverem criados e as chaves no `.env.local`,
sigo para a Fase 1 (modelagem do banco de dados).
