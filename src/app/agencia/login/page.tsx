import { signInAgencia } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  credenciais: "E-mail ou senha incorretos.",
  sem_acesso: "Este login não tem acesso ao painel da agência.",
};

export default async function AgenciaLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; debug?: string }>;
}) {
  const { error, debug } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-8 text-neutral-100">
      <form action={signInAgencia} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Login da agência</h1>
        {error && (
          <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">
            {ERROR_MESSAGES[error] ?? "Não foi possível entrar."}
          </p>
        )}
        {debug && (
          <p className="break-all rounded-md bg-yellow-950 px-3 py-2 text-xs text-yellow-300">
            DEBUG: {debug}
          </p>
        )}
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-neutral-400">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-neutral-400">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-neutral-100 px-4 py-2 font-medium text-neutral-900 hover:bg-neutral-300"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
