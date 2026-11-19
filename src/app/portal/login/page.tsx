import Image from "next/image";
import { Field, ErrorBanner } from "@/components/form-field";
import { signInPortal } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  credenciais: "E-mail ou senha incorretos.",
  sem_acesso: "Este login não tem acesso a nenhum portal de cliente.",
};

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col items-center justify-center bg-fox-olive p-12 md:flex">
        <Image
          src="/brand/fox-wordmark-on-olive.png"
          alt="FOX — Agência de Marketing"
          width={260}
          height={260}
        />
      </div>
      <div className="flex w-full items-center justify-center bg-fox-cream p-8 md:w-1/2">
        <form action={signInPortal} className="w-full max-w-sm space-y-4">
          <h1 className="font-serif text-xl font-semibold text-neutral-900">Portal do cliente</h1>
          {error && <ErrorBanner message={ERROR_MESSAGES[error] ?? "Não foi possível entrar."} />}
          <Field label="E-mail" name="email" type="email" required />
          <Field label="Senha" name="password" type="password" required />
          <button
            type="submit"
            className="w-full rounded-md bg-fox-orange px-4 py-2 font-medium text-white hover:bg-fox-orange-dark"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
