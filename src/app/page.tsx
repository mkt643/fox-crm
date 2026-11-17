import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 p-8 text-center text-neutral-100">
      <h1 className="text-3xl font-semibold">FOX — Gestão de Conteúdo</h1>
      <p className="max-w-md text-neutral-400">
        Escolha por onde deseja entrar.
      </p>
      <div className="flex gap-4">
        <Link
          href="/agencia/login"
          className="rounded-md bg-neutral-100 px-5 py-2 font-medium text-neutral-900 hover:bg-neutral-300"
        >
          Painel da agência
        </Link>
        <Link
          href="/portal/login"
          className="rounded-md border border-neutral-700 px-5 py-2 font-medium hover:bg-neutral-900"
        >
          Portal do cliente
        </Link>
      </div>
    </main>
  );
}
