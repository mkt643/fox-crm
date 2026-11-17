import { requireAgencyMember } from "@/lib/auth/require";
import { signOutAgencia } from "../login/actions";

export default async function AgenciaProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { member } = await requireAgencyMember();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <nav className="flex items-center justify-between gap-4 border-b border-neutral-800 px-6 py-4 text-sm">
        <div className="flex gap-4">
          <a href="/agencia/dashboard">Dashboard</a>
          <a href="/agencia/clientes">Clientes</a>
          <a href="/agencia/posts">Fila de aprovação</a>
        </div>
        <form action={signOutAgencia} className="flex items-center gap-3">
          <span className="text-neutral-400">{member.name}</span>
          <button type="submit" className="text-neutral-400 hover:text-neutral-100">
            Sair
          </button>
        </form>
      </nav>
      <div className="p-6">{children}</div>
    </div>
  );
}
