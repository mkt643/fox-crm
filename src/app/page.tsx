import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-fox-cream p-8 text-center text-neutral-900">
      <Image src="/brand/fox-icon-on-cream.png" alt="FOX" width={88} height={88} />
      <h1 className="text-3xl font-semibold">FOX — Gestão de Conteúdo</h1>
      <p className="max-w-md text-neutral-500">
        Escolha por onde deseja entrar.
      </p>
      <div className="flex gap-4">
        <Link
          href="/agencia/login"
          className="rounded-md bg-fox-orange px-5 py-2 font-medium text-white hover:bg-fox-orange-dark"
        >
          Painel da agência
        </Link>
        <Link
          href="/portal/login"
          className="rounded-md border border-neutral-300 px-5 py-2 font-medium hover:bg-fox-cream"
        >
          Portal do cliente
        </Link>
      </div>
    </main>
  );
}
