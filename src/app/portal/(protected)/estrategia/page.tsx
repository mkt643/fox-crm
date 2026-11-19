import Link from "next/link";
import { requireClient } from "@/lib/auth/require";

const TABS = [
  { value: "entender", label: "01 Entender" },
  { value: "definir", label: "02 Definir" },
  { value: "converter", label: "03 Converter" },
  { value: "produzir", label: "04 Produzir" },
];

function Bullets({ text }: { text: string | null | undefined }) {
  const lines = (text ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return <p className="text-sm text-neutral-400">—</p>;
  return (
    <ul className="space-y-1 text-sm text-neutral-600">
      {lines.map((l, i) => (
        <li key={i} className="flex gap-1.5">
          <span>•</span>
          <span>{l}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function EstrategiaPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const { aba } = await searchParams;
  const activeTab = TABS.some((t) => t.value === aba) ? aba! : "entender";
  const { supabase, client } = await requireClient();

  const [
    { data: strategy },
    { data: awareness },
    { data: pillars },
    { data: channels },
    { data: journey },
    { data: funnel },
    { data: faq },
    { data: sections },
  ] = await Promise.all([
    supabase
      .from("brand_strategy")
      .select(
        "positioning, differentiation, competition, personality_traits, tone_dos, tone_donts, always_text, never_text",
      )
      .eq("client_id", client.id)
      .maybeSingle(),
    supabase
      .from("brand_awareness_stages")
      .select("id, stage_label, what_audience_thinks, what_brand_shows")
      .eq("client_id", client.id)
      .order("position"),
    supabase
      .from("brand_editorial_pillars")
      .select("id, name, percentage, description")
      .eq("client_id", client.id)
      .order("position"),
    supabase
      .from("brand_channels")
      .select("id, channel, frequency, format")
      .eq("client_id", client.id)
      .order("position"),
    supabase
      .from("brand_journey_steps")
      .select("id, step_name, description")
      .eq("client_id", client.id)
      .order("position"),
    supabase
      .from("brand_funnel_stages")
      .select("id, stage_name, description")
      .eq("client_id", client.id)
      .order("position"),
    supabase.from("medical_ads_faq").select("id, question, answer").order("position"),
    supabase.from("strategy_sections").select("id, title, content").eq("client_id", client.id).order("position"),
  ]);

  const traits = (strategy?.personality_traits ?? []) as { trait: string; is: string; isnot: string }[];

  const hasStructuredContent =
    (awareness?.length ?? 0) > 0 ||
    (pillars?.length ?? 0) > 0 ||
    (channels?.length ?? 0) > 0 ||
    (journey?.length ?? 0) > 0 ||
    (funnel?.length ?? 0) > 0 ||
    !!strategy;

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-serif text-2xl font-semibold">Estratégia</h1>

      {!hasStructuredContent && !sections?.length && (
        <p className="text-sm text-neutral-500">Nenhuma estratégia publicada ainda.</p>
      )}

      {sections && sections.length > 0 && (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <h2 className="font-medium">{section.title}</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-500">{section.content}</p>
            </div>
          ))}
        </div>
      )}

      {hasStructuredContent && (
        <>
          <nav className="flex flex-wrap gap-1 border-b border-neutral-200 pb-2">
            {TABS.map((t) => (
              <Link
                key={t.value}
                href={`/portal/estrategia?aba=${t.value}`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  activeTab === t.value ? "bg-fox-olive text-white" : "text-neutral-500 hover:bg-fox-cream"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          {activeTab === "entender" && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">5 estágios de consciência</h2>
              <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                      <th className="px-3 py-2">Estágio</th>
                      <th className="px-3 py-2">O que a pessoa pensa</th>
                      <th className="px-3 py-2">O que a marca mostra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {awareness?.map((a) => (
                      <tr key={a.id} className="border-b border-neutral-100 last:border-0 align-top">
                        <td className="px-3 py-2 font-medium">{a.stage_label}</td>
                        <td className="px-3 py-2 text-neutral-600">"{a.what_audience_thinks}"</td>
                        <td className="px-3 py-2 text-neutral-600">{a.what_brand_shows}</td>
                      </tr>
                    ))}
                    {!awareness?.length && (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-sm text-neutral-500">
                          Nada por aqui ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "definir" && (
            <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
              <h2 className="text-sm font-semibold">Guia da marca</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold text-neutral-500">Posicionamento</p>
                  <p className="text-sm text-neutral-600">{strategy?.positioning || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-500">Diferencial</p>
                  <p className="text-sm text-neutral-600">{strategy?.differentiation || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-500">Concorrência</p>
                  <p className="text-sm text-neutral-600">{strategy?.competition || "—"}</p>
                </div>
              </div>
              {traits.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-neutral-500">Personalidade</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {traits.map((t, i) => (
                      <div key={i} className="rounded-md bg-fox-cream p-3 text-sm">
                        <p className="font-medium">{t.trait}</p>
                        <p className="text-green-700">É: {t.is}</p>
                        <p className="text-red-700">Não é: {t.isnot}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold tracking-wide text-green-700 uppercase">Como fala — sim</p>
                  <Bullets text={strategy?.tone_dos} />
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold tracking-wide text-red-700 uppercase">Como fala — não</p>
                  <Bullets text={strategy?.tone_donts} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "converter" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-sm font-semibold">Jornada de quem compra</h2>
                <div className="grid gap-2 sm:grid-cols-5">
                  {journey?.map((j, i) => (
                    <div key={j.id} className="rounded-md border border-neutral-200 bg-white p-3 text-sm">
                      <p className="text-xs font-semibold text-fox-orange">{i + 1}</p>
                      <p className="font-medium">{j.step_name}</p>
                      <p className="text-xs text-neutral-500">{j.description}</p>
                    </div>
                  ))}
                  {!journey?.length && <p className="text-sm text-neutral-500">Nada por aqui ainda.</p>}
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-sm font-semibold">Funil de vendas</h2>
                <ul className="space-y-1.5">
                  {funnel?.map((f) => (
                    <li key={f.id} className="rounded-md border border-neutral-200 bg-white p-3 text-sm">
                      <span className="font-medium">{f.stage_name}</span>
                      {f.description && <span className="text-neutral-500"> — {f.description}</span>}
                    </li>
                  ))}
                  {!funnel?.length && <p className="text-sm text-neutral-500">Nada por aqui ainda.</p>}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "produzir" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-sm font-semibold">Linhas editoriais e formatos</h2>
                <ul className="space-y-2">
                  {pillars?.map((p) => (
                    <li key={p.id} className="rounded-md border border-neutral-200 bg-white p-3 text-sm">
                      <span className="font-medium">
                        {p.name} {p.percentage != null && <span className="text-neutral-500">— {p.percentage}%</span>}
                      </span>
                      {p.percentage != null && (
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                          <div className="h-full bg-fox-orange" style={{ width: `${p.percentage}%` }} />
                        </div>
                      )}
                      {p.description && <p className="mt-1 text-xs text-neutral-500">{p.description}</p>}
                    </li>
                  ))}
                  {!pillars?.length && <p className="text-sm text-neutral-500">Nada por aqui ainda.</p>}
                </ul>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-semibold">Canal, frequência e formato</h2>
                <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                        <th className="px-3 py-2">Canal</th>
                        <th className="px-3 py-2">Frequência</th>
                        <th className="px-3 py-2">Formato</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channels?.map((c) => (
                        <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                          <td className="px-3 py-2 font-medium">{c.channel}</td>
                          <td className="px-3 py-2 text-neutral-600">{c.frequency}</td>
                          <td className="px-3 py-2 text-neutral-600">{c.format}</td>
                        </tr>
                      ))}
                      {!channels?.length && (
                        <tr>
                          <td colSpan={3} className="px-3 py-4 text-center text-sm text-neutral-500">
                            Nada por aqui ainda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {(strategy?.always_text || strategy?.never_text) && (
                <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-6">
                  <h2 className="text-sm font-semibold">Diretrizes de redes</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs font-semibold tracking-wide text-green-700 uppercase">Sempre</p>
                      <Bullets text={strategy?.always_text} />
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold tracking-wide text-red-700 uppercase">Nunca</p>
                      <Bullets text={strategy?.never_text} />
                    </div>
                  </div>
                </div>
              )}

              {faq && faq.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <h2 className="text-sm font-semibold">Perguntas frequentes sobre publicidade médica</h2>
                    <p className="text-xs text-neutral-500">Baseado na Resolução CFM nº 2.336/2023.</p>
                  </div>
                  <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
                    {faq.map((f) => (
                      <div key={f.id} className="p-4">
                        <p className="text-sm font-medium">{f.question}</p>
                        <p className="mt-1 text-sm text-neutral-500">{f.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
