"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ErrorBanner } from "@/components/form-field";
import { ColorPaletteFields } from "@/components/color-palette-fields";
import { setClientLogoPath, updateClientColors } from "../../actions";

type Client = {
  id: string;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  light_color: string | null;
};

export function EditBrandingForm({ client, logoUrl }: { client: Client; logoUrl?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(logoUrl);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const primaryColor = String(formData.get("primary_color") ?? "") || null;
    const secondaryColor = String(formData.get("secondary_color") ?? "") || null;
    const accentColor = String(formData.get("accent_color") ?? "") || null;
    const lightColor = String(formData.get("light_color") ?? "") || null;
    const logo = formData.get("logo") as File | null;

    setSubmitting(true);
    try {
      await updateClientColors({
        clientId: client.id,
        primaryColor,
        secondaryColor,
        accentColor,
        lightColor,
      });

      if (logo && logo.size > 0) {
        const supabase = createClient();
        const path = `${client.id}/logo-${Date.now()}-${logo.name}`;
        const { error: uploadError } = await supabase.storage
          .from("brand-assets")
          .upload(path, logo, { contentType: logo.type });

        if (uploadError) throw new Error(uploadError.message);
        await setClientLogoPath(client.id, path);
        setPreview(URL.createObjectURL(logo));
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-md border border-neutral-200 bg-white p-4"
    >
      {error && <ErrorBanner message={error} />}
      {success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Identidade visual atualizada.
        </p>
      )}

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Logo atual"
          className="h-16 w-16 rounded-md border border-neutral-200 bg-white object-contain p-1"
        />
      )}

      <ColorPaletteFields
        defaults={{
          primary: client.primary_color,
          secondary: client.secondary_color,
          accent: client.accent_color,
          light: client.light_color,
        }}
      />

      <div className="space-y-1">
        <label htmlFor="logo" className="text-sm text-neutral-500">
          Trocar logo (opcional)
        </label>
        <input id="logo" name="logo" type="file" accept="image/*" className="w-full text-sm" />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark disabled:opacity-60"
      >
        {submitting ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
