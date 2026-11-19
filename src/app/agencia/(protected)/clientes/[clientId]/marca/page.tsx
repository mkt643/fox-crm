import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAgencyMember } from "@/lib/auth/require";
import { Field, TextAreaField } from "@/components/form-field";
import { EditBrandingForm } from "./edit-branding-form";
import { updateBrandIdentity, updateBrandBrief } from "./actions";

type ColorMeta = { name?: string; usage?: string };

export default async function ClienteMarcaPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { supabase } = await requireAgencyMember();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, primary_color, secondary_color, accent_color, light_color, logo_path")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) notFound();

  let logoUrl: string | undefined;
  if (client.logo_path) {
    const { data } = await supabase.storage
      .from("brand-assets")
      .createSignedUrl(client.logo_path, 60 * 60);
    logoUrl = data?.signedUrl;
  }

  const { data: identity } = await supabase
    .from("brand_identity")
    .select(
      "tagline, color_meta, logo_use_rules, logo_avoid_rules, typography_heading, typography_body, photo_dos, photo_donts",
    )
    .eq("client_id", clientId)
    .maybeSingle();

  const { data: brief } = await supabase
    .from("brand_brief")
    .select(
      "products_services, differentiator, raw_materials, brand_history, audience_voice, common_questions, media_notes",
    )
    .eq("client_id", clientId)
    .maybeSingle();

  const { data: pendencies } = await supabase
    .from("client_pendencies")
    .select("id, title, status, due_date")
    .eq("client_id", clientId)
    .order("due_date", { ascending: true, nullsFirst: false });

  const open = pendencies?.filter((p) => p.status === "pendente") ?? [];
  const resolved = pendencies?.filter((p) => p.status === "resolvida") ?? [];

  const colorMeta = (identity?.color_meta ?? {}) as Record<string, ColorMeta>;
  const colors = [
    { key: "primary", label: "Primária", hex: client.primary_color },
    { key: "secondary", label: "Secundária", hex: client.secondary_color },
    { key: "accent", label: "Destaque", hex: client.accent_color },
    { key: "light", label: "Clara", hex: client.light_color },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      <h1 className="text-xl font-semibold">Marca — {client.name}</h1>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
          Identidade visual
        </h2>
        <EditBrandingForm client={client} logoUrl={logoUrl} />

        <form
          action={updateBrandIdentity}
          className="space-y-5 rounded-lg border border-neutral-200 bg-white p-5"
        >
          <input type="hidden" name="client_id" value={clientId} />

          <Field label="Frase de assinatura (tagline)" name="tagline" defaultValue={identity?.tagline ?? ""} />

          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Paleta — nome e uso de cada cor
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {colors.map((c) => (
                <div key={c.key} className="flex gap-3 rounded-md border border-neutral-100 p-3">
                  <span
                    className="mt-1 h-8 w-8 flex-shrink-0 rounded-full border border-neutral-200"
                    style={{ backgroundColor: c.hex ?? "#e5e5e5" }}
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      name={`${c.key}_name`}
                      placeholder={`Nome (ex: ${c.label})`}
                      defaultValue={colorMeta[c.key]?.name ?? ""}
                      className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm"
                    />
                    <input
                      name={`${c.key}_usage`}
                      placeholder="Onde usar (ex: destaque, botões, cta)"
                      defaultValue={colorMeta[c.key]?.usage ?? ""}
                      className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Tipografia de títulos"
              name="typography_heading"
              placeholder="Ex: Serifa elegante"
              defaultValue={identity?.typography_heading ?? ""}
            />
            <Field
              label="Tipografia de texto"
              name="typography_body"
              placeholder="Ex: Sem serifa, limpa"
              defaultValue={identity?.typography_body ?? ""}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <TextAreaField
              label="O selo — use assim (uma regra por linha)"
              name="logo_use_rules"
              rows={3}
              defaultValue={identity?.logo_use_rules ?? ""}
            />
            <TextAreaField
              label="O selo — evite (uma regra por linha)"
              name="logo_avoid_rules"
              rows={3}
              defaultValue={identity?.logo_avoid_rules ?? ""}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <TextAreaField
              label="Fotos — faça assim"
              name="photo_dos"
              rows={3}
              defaultValue={identity?.photo_dos ?? ""}
            />
            <TextAreaField
              label="Fotos — evite"
              name="photo_donts"
              rows={3}
              defaultValue={identity?.photo_donts ?? ""}
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark"
          >
            Salvar identidade visual
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
          O que é seu (brief)
        </h2>
        <form
          action={updateBrandBrief}
          className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-5 sm:grid-cols-2"
        >
          <input type="hidden" name="client_id" value={clientId} />
          <TextAreaField
            label="Produtos ou serviços (um por linha)"
            name="products_services"
            rows={4}
            defaultValue={brief?.products_services ?? ""}
          />
          <TextAreaField
            label="Diferencial — o que te faz diferente?"
            name="differentiator"
            rows={4}
            defaultValue={brief?.differentiator ?? ""}
          />
          <TextAreaField
            label="Matéria-prima e conteúdo disponível"
            name="raw_materials"
            rows={4}
            defaultValue={brief?.raw_materials ?? ""}
          />
          <TextAreaField
            label="História da marca e de quem está por trás"
            name="brand_history"
            rows={4}
            defaultValue={brief?.brand_history ?? ""}
          />
          <TextAreaField
            label="Como o público da marca fala"
            name="audience_voice"
            rows={3}
            defaultValue={brief?.audience_voice ?? ""}
          />
          <TextAreaField
            label="Perguntas que a marca mais recebe"
            name="common_questions"
            rows={3}
            defaultValue={brief?.common_questions ?? ""}
          />
          <div className="sm:col-span-2">
            <TextAreaField
              label="Fotos e vídeos disponíveis"
              name="media_notes"
              rows={2}
              defaultValue={brief?.media_notes ?? ""}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark"
            >
              Salvar brief
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            O que a gente precisa de você
          </h2>
          <Link
            href={`/agencia/clientes/${clientId}/pendencias`}
            className="text-sm font-medium text-fox-orange hover:underline"
          >
            Gerenciar pendências ›
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold text-neutral-500">EM ABERTO ({open.length})</p>
            {!open.length && <p className="text-sm text-neutral-400">Nada pendente.</p>}
            <ul className="space-y-1.5 text-sm">
              {open.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span>{p.title}</span>
                  <span className="flex-shrink-0 text-xs text-neutral-400">
                    {p.due_date ?? "sem prazo"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold text-neutral-500">JÁ ENTREGUE ({resolved.length})</p>
            {!resolved.length && <p className="text-sm text-neutral-400">Nada entregue ainda.</p>}
            <ul className="space-y-1.5 text-sm text-neutral-500">
              {resolved.map((p) => (
                <li key={p.id}>{p.title}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
