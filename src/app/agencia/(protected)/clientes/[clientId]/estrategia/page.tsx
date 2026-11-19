import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAgencyMember } from "@/lib/auth/require";
import { Field, TextAreaField } from "@/components/form-field";
import {
  updateBrandStrategy,
  addAwarenessStage,
  addPillar,
  addChannel,
  addJourneyStep,
  addFunnelStage,
  deleteRow,
} from "./actions";

const TABS = [
  { value: "entender", label: "01 Entender" },
  { value: "definir", label: "02 Definir" },
  { value: "converter", label: "03 Converter" },
  { value: "produzir", label: "04 Produzir" },
];

export default async function EstrategiaPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const { clientId } = await params;
  const { aba } = await searchParams;
  const activeTab = TABS.some((t) => t.value === aba) ? aba! : "entender";
  const { supabase } = await requireAgencyMember();

  const { data: client } = await supabase.from("clients").select("id, name").eq("id", clientId).maybeSingle();
  if (!client) notFound();

  const [
    { data: strategy },
    { data: awareness },
    { data: pillars },
    { data: channels },
    { data: journey },
    { data: funnel },
  ] = await Promise.all([
    supabase
      .from("brand_strategy")
      .select(
        "positioning, differentiation, competition, personality_traits, tone_dos, tone_donts, always_text, never_text",
      )
      .eq("client_id", clientId)
      .maybeSingle(),
    supabase
      .from("brand_awareness_stages")
      .select("id, stage_label, what_audience_thinks, what_brand_shows")
      .eq("client_id", clientId)
      .order("position"),
    supabase
      .from("brand_editorial_pillars")
      .select("id, name, percentage, description")
      .eq("client_id", clientId)
      .order("position"),
    supabase
      .from("brand_channels")
      .select("id, channel, frequency, format")
      .eq("client_id", clientId)
      .order("position"),
    supabase
      .from("brand_journey_steps")
      .select("id, step_name, description")
      .eq("client_id", clientId)
      .order("position"),
    supabase
      .from("brand_funnel_stages")
      .select("id, stage_name, description")
      .eq("client_id", clientId)
      .order("position"),
  ]);

  const traits = (strategy?.personality_traits ?? []) as { trait: string; is: string; isnot: string }[];
  const traitsAsLines = traits.map((t) => `${t.trait} | ${t.is} | ${t.isnot}`).join("\n");

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-xl font-semibold">Estratégia — {client.name}</h1>

      <nav className="flex flex-wrap gap-1 border-b border-neutral-200 pb-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/agencia/clientes/${clientId}/estrategia?aba=${t.value}`}
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
          <div>
            <h2 className="text-sm font-semibold">5 estágios de consciência</h2>
            <p className="text-xs text-neutral-500">
              O que a pessoa pensa em cada estágio, e o que a marca mostra pra avançar ela.
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                  <th className="px-3 py-2">Estágio</th>
                  <th className="px-3 py-2">O que a pessoa pensa</th>
                  <th className="px-3 py-2">O que a marca mostra</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {awareness?.map((a) => (
                  <tr key={a.id} className="border-b border-neutral-100 last:border-0 align-top">
                    <td className="px-3 py-2 font-medium">{a.stage_label}</td>
                    <td className="px-3 py-2 text-neutral-600">"{a.what_audience_thinks}"</td>
                    <td className="px-3 py-2 text-neutral-600">{a.what_brand_shows}</td>
                    <td className="px-3 py-2 text-right">
                      <form action={deleteRow}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="kind" value="awareness" />
                        <input type="hidden" name="client_id" value={clientId} />
                        <button type="submit" className="text-xs text-red-600 hover:text-red-700">
                          Excluir
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {!awareness?.length && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-sm text-neutral-500">
                      Nenhum estágio cadastrado. Sugestão: Inconsciente, Consciente do problema, Consciente
                      da solução, Consciente do produto, Totalmente consciente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <form
            action={addAwarenessStage}
            className="grid gap-2 rounded-md border border-neutral-200 bg-white p-4 sm:grid-cols-3"
          >
            <input type="hidden" name="client_id" value={clientId} />
            <Field label="Estágio" name="stage_label" placeholder="Ex: Inconsciente" required />
            <Field label='"O que a pessoa pensa"' name="what_audience_thinks" placeholder='Ex: "Minha pele é assim mesmo."' />
            <Field label="O que a marca mostra" name="what_brand_shows" />
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-fox-cream"
              >
                Adicionar estágio
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "definir" && (
        <form
          action={updateBrandStrategy}
          className="space-y-5 rounded-lg border border-neutral-200 bg-white p-5"
        >
          <input type="hidden" name="client_id" value={clientId} />
          <div>
            <h2 className="text-sm font-semibold">Guia da marca</h2>
            <p className="text-xs text-neutral-500">Quem a marca é, como se parece e como fala.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <TextAreaField label="Posicionamento" name="positioning" rows={3} defaultValue={strategy?.positioning ?? ""} />
            <TextAreaField label="Diferencial" name="differentiation" rows={3} defaultValue={strategy?.differentiation ?? ""} />
            <TextAreaField label="Concorrência" name="competition" rows={3} defaultValue={strategy?.competition ?? ""} />
          </div>
          <div className="space-y-1">
            <label htmlFor="personality_traits" className="text-sm text-neutral-500">
              Personalidade — uma por linha: traço | é | não é
            </label>
            <textarea
              id="personality_traits"
              name="personality_traits"
              rows={4}
              defaultValue={traitsAsLines}
              placeholder="Acolhedora | Recebe pelo nome, explica com calma | Íntima demais ou cheia de gírias"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextAreaField label="Como fala — sim" name="tone_dos" rows={3} defaultValue={strategy?.tone_dos ?? ""} />
            <TextAreaField label="Como fala — não" name="tone_donts" rows={3} defaultValue={strategy?.tone_donts ?? ""} />
          </div>
          <button
            type="submit"
            className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark"
          >
            Salvar guia da marca
          </button>
        </form>
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
                  <form action={deleteRow} className="mt-1">
                    <input type="hidden" name="id" value={j.id} />
                    <input type="hidden" name="kind" value="journey" />
                    <input type="hidden" name="client_id" value={clientId} />
                    <button type="submit" className="text-xs text-red-600 hover:text-red-700">
                      Excluir
                    </button>
                  </form>
                </div>
              ))}
              {!journey?.length && <p className="text-sm text-neutral-500">Nenhuma etapa cadastrada.</p>}
            </div>
            <form action={addJourneyStep} className="flex flex-wrap gap-2 rounded-md border border-neutral-200 bg-white p-3">
              <input type="hidden" name="client_id" value={clientId} />
              <Field label="Etapa" name="step_name" placeholder="Ex: Descobre" required />
              <Field label="Descrição" name="description" />
              <div className="flex items-end">
                <button type="submit" className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-fox-cream">
                  Adicionar
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Funil de vendas</h2>
            <ul className="space-y-1.5">
              {funnel?.map((f) => (
                <li key={f.id} className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-3 text-sm">
                  <span>
                    <span className="font-medium">{f.stage_name}</span>
                    {f.description && <span className="text-neutral-500"> — {f.description}</span>}
                  </span>
                  <form action={deleteRow}>
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="kind" value="funnel" />
                    <input type="hidden" name="client_id" value={clientId} />
                    <button type="submit" className="text-xs text-red-600 hover:text-red-700">
                      Excluir
                    </button>
                  </form>
                </li>
              ))}
              {!funnel?.length && <p className="text-sm text-neutral-500">Nenhuma etapa cadastrada.</p>}
            </ul>
            <form action={addFunnelStage} className="flex flex-wrap gap-2 rounded-md border border-neutral-200 bg-white p-3">
              <input type="hidden" name="client_id" value={clientId} />
              <Field label="Etapa" name="stage_name" placeholder="Ex: Topo de funil" required />
              <Field label="Descrição" name="description" />
              <div className="flex items-end">
                <button type="submit" className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-fox-cream">
                  Adicionar
                </button>
              </div>
            </form>
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
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {p.name} {p.percentage != null && <span className="text-neutral-500">— {p.percentage}%</span>}
                    </span>
                    <form action={deleteRow}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="kind" value="pillar" />
                      <input type="hidden" name="client_id" value={clientId} />
                      <button type="submit" className="text-xs text-red-600 hover:text-red-700">
                        Excluir
                      </button>
                    </form>
                  </div>
                  {p.percentage != null && (
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full bg-fox-orange" style={{ width: `${p.percentage}%` }} />
                    </div>
                  )}
                  {p.description && <p className="mt-1 text-xs text-neutral-500">{p.description}</p>}
                </li>
              ))}
              {!pillars?.length && <p className="text-sm text-neutral-500">Nenhum pilar cadastrado.</p>}
            </ul>
            <form action={addPillar} className="flex flex-wrap gap-2 rounded-md border border-neutral-200 bg-white p-3">
              <input type="hidden" name="client_id" value={clientId} />
              <Field label="Pilar" name="name" placeholder="Ex: Educação" required />
              <Field label="%" name="percentage" type="number" min={0} max={100} />
              <Field label="Descrição" name="description" />
              <div className="flex items-end">
                <button type="submit" className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-fox-cream">
                  Adicionar
                </button>
              </div>
            </form>
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
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {channels?.map((c) => (
                    <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-3 py-2 font-medium">{c.channel}</td>
                      <td className="px-3 py-2 text-neutral-600">{c.frequency}</td>
                      <td className="px-3 py-2 text-neutral-600">{c.format}</td>
                      <td className="px-3 py-2 text-right">
                        <form action={deleteRow}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="kind" value="channel" />
                          <input type="hidden" name="client_id" value={clientId} />
                          <button type="submit" className="text-xs text-red-600 hover:text-red-700">
                            Excluir
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {!channels?.length && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-sm text-neutral-500">
                        Nenhum canal cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <form action={addChannel} className="flex flex-wrap gap-2 rounded-md border border-neutral-200 bg-white p-3">
              <input type="hidden" name="client_id" value={clientId} />
              <Field label="Canal" name="channel" placeholder="Ex: Feed do Instagram" required />
              <Field label="Frequência" name="frequency" placeholder="Ex: 10 posts por mês" />
              <Field label="Formato" name="format" placeholder="Ex: 4 carrosséis, 3 estáticos..." />
              <div className="flex items-end">
                <button type="submit" className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-fox-cream">
                  Adicionar
                </button>
              </div>
            </form>
          </div>

          <form
            action={updateBrandStrategy}
            className="space-y-3 rounded-lg border border-neutral-200 bg-white p-5"
          >
            <input type="hidden" name="client_id" value={clientId} />
            <input type="hidden" name="positioning" value={strategy?.positioning ?? ""} />
            <input type="hidden" name="differentiation" value={strategy?.differentiation ?? ""} />
            <input type="hidden" name="competition" value={strategy?.competition ?? ""} />
            <input type="hidden" name="personality_traits" value={traitsAsLines} />
            <input type="hidden" name="tone_dos" value={strategy?.tone_dos ?? ""} />
            <input type="hidden" name="tone_donts" value={strategy?.tone_donts ?? ""} />
            <h2 className="text-sm font-semibold">Diretrizes de redes</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextAreaField label="Sempre (uma regra por linha)" name="always_text" rows={4} defaultValue={strategy?.always_text ?? ""} />
              <TextAreaField label="Nunca (uma regra por linha)" name="never_text" rows={4} defaultValue={strategy?.never_text ?? ""} />
            </div>
            <button
              type="submit"
              className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark"
            >
              Salvar diretrizes
            </button>
          </form>

          <Link
            href="/agencia/faq-publicidade-medica"
            className="block rounded-lg border border-neutral-200 bg-white p-4 text-sm font-medium text-fox-orange hover:underline"
          >
            Gerenciar perguntas frequentes sobre publicidade médica ›
          </Link>
        </div>
      )}
    </div>
  );
}
