import { requireClient } from "@/lib/auth/require";

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  pendente: "bg-neutral-100 text-neutral-700",
  pago: "bg-green-100 text-green-800",
  atrasado: "bg-red-100 text-red-700",
  cancelado: "bg-neutral-100 text-neutral-400",
};

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function FinanceiroPage() {
  const { supabase, client } = await requireClient();

  const { data: clientRow } = await supabase
    .from("clients")
    .select("monthly_base_cents")
    .eq("id", client.id)
    .maybeSingle();

  const { data: invoices } = await supabase
    .from("client_invoices")
    .select("id, description, amount_cents, due_date, status, pix_code, boleto_path, invoice_path")
    .eq("client_id", client.id)
    .order("due_date", { ascending: false });

  const invoicesWithUrls = await Promise.all(
    (invoices ?? []).map(async (inv) => {
      const [boleto, nf] = await Promise.all([
        inv.boleto_path
          ? supabase.storage.from("client-documents").createSignedUrl(inv.boleto_path, 60 * 60)
          : Promise.resolve({ data: null }),
        inv.invoice_path
          ? supabase.storage.from("client-documents").createSignedUrl(inv.invoice_path, 60 * 60)
          : Promise.resolve({ data: null }),
      ]);
      return {
        ...inv,
        boletoUrl: boleto.data?.signedUrl,
        invoiceUrl: nf.data?.signedUrl,
      };
    }),
  );

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: usage } = await supabase
    .from("client_service_usage")
    .select("id, service_id, quantity")
    .eq("client_id", client.id)
    .eq("month", currentMonth);

  const { data: extraServices } = await supabase
    .from("client_services")
    .select("id, label, unit_price_cents")
    .eq("client_id", client.id)
    .eq("category", "extra");

  const extrasThisMonth = (usage ?? [])
    .map((u) => {
      const service = extraServices?.find((s) => s.id === u.service_id);
      if (!service || service.unit_price_cents == null) return null;
      return { label: service.label, quantity: u.quantity, total: service.unit_price_cents * u.quantity };
    })
    .filter((x): x is { label: string; quantity: number; total: number } => x !== null);

  const extrasTotal = extrasThisMonth.reduce((sum, e) => sum + e.total, 0);
  const baseTotal = clientRow?.monthly_base_cents ?? 0;
  const estimateTotal = baseTotal + extrasTotal;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Financeiro</h1>

      <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold">
          Estimativa do próximo pagamento (
          {now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })})
        </h2>
        <div className="space-y-1 text-sm">
          {baseTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Plano mensal</span>
              <span>{formatCurrency(baseTotal)}</span>
            </div>
          )}
          {extrasThisMonth.map((e, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-neutral-500">
                {e.label} × {e.quantity}
              </span>
              <span>{formatCurrency(e.total)}</span>
            </div>
          ))}
          {!baseTotal && !extrasThisMonth.length && (
            <p className="text-neutral-500">Estimativa ainda não disponível.</p>
          )}
        </div>
        {(baseTotal > 0 || extrasThisMonth.length > 0) && (
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-sm font-semibold">
            <span>Total estimado</span>
            <span>{formatCurrency(estimateTotal)}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">Pagamentos</h2>
        {!invoicesWithUrls.length && (
          <p className="rounded-md border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
            Nenhum pagamento registrado ainda.
          </p>
        )}
        <ul className="space-y-2">
          {invoicesWithUrls.map((inv) => (
            <li key={inv.id} className="rounded-md border border-neutral-200 bg-white p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{inv.description}</p>
                  <p className="text-neutral-500">
                    {formatCurrency(inv.amount_cents)}
                    {inv.due_date ? ` · vence em ${inv.due_date}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[inv.status] ?? "bg-neutral-100 text-neutral-700"}`}
                >
                  {STATUS_LABELS[inv.status] ?? inv.status}
                </span>
              </div>
              {inv.pix_code && (
                <p className="mt-2 rounded-md bg-fox-cream p-2 text-xs break-all">
                  <span className="font-medium">PIX copia e cola:</span> {inv.pix_code}
                </p>
              )}
              <div className="mt-2 flex gap-3 text-xs">
                {inv.boletoUrl && (
                  <a
                    href={inv.boletoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-fox-orange hover:underline"
                  >
                    Ver boleto
                  </a>
                )}
                {inv.invoiceUrl && (
                  <a
                    href={inv.invoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-fox-orange hover:underline"
                  >
                    Ver nota fiscal
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
