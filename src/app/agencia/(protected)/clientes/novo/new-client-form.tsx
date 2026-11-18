"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, ErrorBanner } from "@/components/form-field";
import { ColorPaletteFields } from "@/components/color-palette-fields";
import { createClientAccount, setClientLogoPath } from "../actions";

export function NewClientForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const primaryColor = String(formData.get("primary_color") ?? "") || null;
    const secondaryColor = String(formData.get("secondary_color") ?? "") || null;
    const accentColor = String(formData.get("accent_color") ?? "") || null;
    const lightColor = String(formData.get("light_color") ?? "") || null;
    const logo = formData.get("logo") as File | null;

    setSubmitting(true);
    try {
      const clientId = await createClientAccount({
        name,
        email,
        password,
        primaryColor,
        secondaryColor,
        accentColor,
        lightColor,
      });

      if (logo && logo.size > 0) {
        const supabase = createClient();
        const path = `${clientId}/logo-${Date.now()}-${logo.name}`;
        const { error: uploadError } = await supabase.storage
          .from("brand-assets")
          .upload(path, logo, { contentType: logo.type });

        if (!uploadError) {
          await setClientLogoPath(clientId, path);
        }
      }

      router.push("/agencia/clientes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cadastrar.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}
      <Field label="Nome do cliente" name="name" required />
      <Field label="E-mail de login do cliente" name="email" type="email" required />
      <Field
        label="Senha inicial (avise o cliente por fora)"
        name="password"
        type="password"
        required
        minLength={8}
      />
      <div className="space-y-1">
        <p className="text-sm text-neutral-500">Paleta de cores (usada no portal do cliente)</p>
        <ColorPaletteFields />
      </div>
      <div className="space-y-1">
        <label htmlFor="logo" className="text-sm text-neutral-500">
          Logo (opcional)
        </label>
        <input id="logo" name="logo" type="file" accept="image/*" className="w-full text-sm" />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-fox-orange px-4 py-2 font-medium text-white hover:bg-fox-orange-dark disabled:opacity-60"
      >
        {submitting ? "Criando..." : "Criar cliente"}
      </button>
    </form>
  );
}
