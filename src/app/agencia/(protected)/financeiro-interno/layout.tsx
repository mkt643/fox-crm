import { TabLink } from "@/components/tab-link";

export default function FinanceiroInternoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Financeiro da agência</h1>
        <p className="text-sm text-neutral-500">
          Receita, custos, lucro e clientes da FOX — visível só pra agência.
        </p>
      </div>
      <nav className="flex gap-1 border-b border-neutral-200 pb-2">
        <TabLink href="/agencia/financeiro-interno">Dashboard</TabLink>
        <TabLink href="/agencia/financeiro-interno/clientes">Receitas / Clientes</TabLink>
        <TabLink href="/agencia/financeiro-interno/custos">Custos / Fornecedores</TabLink>
      </nav>
      {children}
    </div>
  );
}
