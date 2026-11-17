import { Field, ErrorBanner } from "@/components/form-field";
import { createClientAccount } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  dados_invalidos: "Preencha nome, e-mail e uma senha com pelo menos 8 caracteres.",
  email_em_uso: "Já existe um login com esse e-mail.",
  erro_criar_login: "Não foi possível criar o login do cliente. Tente de novo.",
  erro_criar_cliente:
    "Login criado, mas houve um erro ao salvar o cliente. Fale com o suporte.",
};

export default async function NovoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">Novo cliente</h1>
      {error && <ErrorBanner message={ERROR_MESSAGES[error] ?? "Não foi possível cadastrar."} />}

      <form action={createClientAccount} className="space-y-4" encType="multipart/form-data">
        <Field label="Nome do cliente" name="name" required />
        <Field label="E-mail de login do cliente" name="email" type="email" required />
        <Field
          label="Senha inicial (avise o cliente por fora)"
          name="password"
          type="password"
          required
          minLength={8}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cor primária" name="primary_color" type="color" defaultValue="#171717" />
          <Field
            label="Cor secundária"
            name="secondary_color"
            type="color"
            defaultValue="#737373"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="logo" className="text-sm text-neutral-400">
            Logo (opcional)
          </label>
          <input id="logo" name="logo" type="file" accept="image/*" className="w-full text-sm" />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-neutral-100 px-4 py-2 font-medium text-neutral-900 hover:bg-neutral-300"
        >
          Criar cliente
        </button>
      </form>
    </div>
  );
}
