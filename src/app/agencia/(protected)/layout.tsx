import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAgencia } from "../login/actions";

export default async function AgenciaProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/agencia/login");
  }

  const { data: member } = await supabase
    .from("agency_members")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  if (!member) {
    redirect("/agencia/login");
  }

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
