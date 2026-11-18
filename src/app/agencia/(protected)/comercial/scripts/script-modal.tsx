"use client";

import { useState } from "react";
import { Field, TextAreaField } from "@/components/form-field";
import { SCRIPT_CATEGORIES } from "@/lib/comercial/calc";
import { createScript, updateScript, deleteScript } from "../actions";

type Script = {
  id: string;
  name: string;
  objective: string | null;
  category: string;
  journey_moment: string | null;
  body: string | null;
  notes: string | null;
};

export function NewScriptButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark"
      >
        Novo Script
      </button>
      {open && <ScriptModal onClose={() => setOpen(false)} />}
    </>
  );
}

export function ScriptCard({ script }: { script: Script }) {
  const [open, setOpen] = useState(false);
  const categoryLabel = SCRIPT_CATEGORIES.find((c) => c.value === script.category)?.label ?? script.category;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-neutral-200 bg-white p-4 text-left hover:border-fox-orange"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium">{script.name}</p>
          <span className="rounded-full bg-fox-cream px-2 py-0.5 text-xs text-neutral-600">
            {categoryLabel}
          </span>
        </div>
        {script.objective && <p className="mt-1 text-sm text-neutral-500">{script.objective}</p>}
      </button>
      {open && <ScriptModal script={script} onClose={() => setOpen(false)} />}
    </>
  );
}

function ScriptModal({ script, onClose }: { script?: Script; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{script ? "Editar script" : "Novo script"}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            ✕
          </button>
        </div>
        <form
          action={async (formData) => {
            if (script) {
              formData.set("id", script.id);
              await updateScript(formData);
            } else {
              await createScript(formData);
            }
            onClose();
          }}
          className="space-y-4"
        >
          <Field label="Nome" name="name" required defaultValue={script?.name} />
          <Field label="Objetivo" name="objective" defaultValue={script?.objective ?? ""} />
          <div className="space-y-1">
            <label htmlFor="category" className="text-sm text-neutral-500">
              Categoria
            </label>
            <select
              id="category"
              name="category"
              required
              defaultValue={script?.category ?? SCRIPT_CATEGORIES[0].value}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              {SCRIPT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <Field label="Momento da jornada" name="journey_moment" defaultValue={script?.journey_moment ?? ""} />
          <TextAreaField label="Texto" name="body" rows={6} defaultValue={script?.body ?? ""} />
          <TextAreaField label="Observações" name="notes" rows={2} defaultValue={script?.notes ?? ""} />

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-fox-cream"
              >
                Cancelar
              </button>
            </div>
            {script && (
              <button
                type="button"
                onClick={async () => {
                  const fd = new FormData();
                  fd.set("id", script.id);
                  await deleteScript(fd);
                  onClose();
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Excluir
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
