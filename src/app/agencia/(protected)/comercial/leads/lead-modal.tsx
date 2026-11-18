"use client";

import { useState } from "react";
import { Field, TextAreaField } from "@/components/form-field";
import { LEAD_STATUSES, statusMeta } from "@/lib/comercial/calc";
import { createLead, updateLead, deleteLead, addLeadAction, deleteLeadAction } from "../actions";

export type Lead = {
  id: string;
  name: string;
  profession: string | null;
  profile_link: string | null;
  whatsapp: string | null;
  origin: string | null;
  entry_date: string;
  status: string;
  next_action_date: string | null;
  potential_value_cents: number | null;
  temperature: string | null;
  notes: string | null;
};

export type LeadAction = {
  id: string;
  action_type: string;
  action_date: string;
  notes: string | null;
};

export function LeadModal({
  lead,
  actions,
  onClose,
}: {
  lead?: Lead;
  actions?: LeadAction[];
  onClose: () => void;
}) {
  const [status, setStatus] = useState(lead?.status ?? "abordar");
  const needsNextDate = statusMeta(status).needsNextDate;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{lead ? "Editar lead" : "Novo lead"}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            ✕
          </button>
        </div>

        <form
          action={async (formData) => {
            if (lead) {
              formData.set("id", lead.id);
              await updateLead(formData);
            } else {
              await createLead(formData);
            }
            onClose();
          }}
          className="space-y-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome *" name="name" required defaultValue={lead?.name} />
            <Field label="Profissão" name="profession" defaultValue={lead?.profession ?? ""} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Link do perfil" name="profile_link" defaultValue={lead?.profile_link ?? ""} />
            <Field label="WhatsApp" name="whatsapp" defaultValue={lead?.whatsapp ?? ""} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Origem do lead" name="origin" defaultValue={lead?.origin ?? ""} />
            <Field
              label="Data de entrada"
              name="entry_date"
              type="date"
              defaultValue={lead?.entry_date ?? new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="status" className="text-sm text-neutral-500">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            {needsNextDate && (
              <Field label="Abordar em" name="next_action_date" type="date" defaultValue={lead?.next_action_date ?? ""} />
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Valor potencial (R$)" name="potential_value" placeholder="0,00" defaultValue={lead?.potential_value_cents != null ? (lead.potential_value_cents / 100).toFixed(2).replace(".", ",") : ""} />
            <div className="space-y-1">
              <label htmlFor="temperature" className="text-sm text-neutral-500">
                Temperatura do lead
              </label>
              <select
                id="temperature"
                name="temperature"
                defaultValue={lead?.temperature ?? ""}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Não definida</option>
                <option value="frio">Lead frio</option>
                <option value="morno">Morno</option>
                <option value="quente">Quente</option>
              </select>
            </div>
          </div>
          <TextAreaField label="Observações" name="notes" rows={3} defaultValue={lead?.notes ?? ""} />

          <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
            <button
              type="submit"
              className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark"
            >
              Salvar lead
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-fox-cream">
                Cancelar
              </button>
              {lead && (
                <button
                  type="button"
                  onClick={async () => {
                    const fd = new FormData();
                    fd.set("id", lead.id);
                    await deleteLead(fd);
                    onClose();
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Excluir
                </button>
              )}
            </div>
          </div>
        </form>

        {lead && (
          <div className="mt-6 space-y-3 border-t border-neutral-100 pt-4">
            <h3 className="text-sm font-semibold">Linha do tempo</h3>
            <p className="text-xs text-neutral-500">
              Ao cadastrar uma ação aqui, o status e a data do lead acima são atualizados automaticamente.
            </p>
            <ul className="space-y-2">
              {(actions ?? []).map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-2 rounded-md bg-fox-cream p-2 text-xs">
                  <div>
                    <p className="font-medium">{statusMeta(a.action_type).label}</p>
                    <p className="text-neutral-500">
                      {new Date(a.action_date + "T00:00:00").toLocaleDateString("pt-BR")}
                      {a.notes ? ` — ${a.notes}` : ""}
                    </p>
                  </div>
                  <form
                    action={async (fd) => {
                      await deleteLeadAction(fd);
                    }}
                  >
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="text-red-500 hover:text-red-700">
                      Excluir
                    </button>
                  </form>
                </li>
              ))}
              {!actions?.length && <p className="text-xs text-neutral-400">Nenhuma ação registrada ainda.</p>}
            </ul>

            <form action={addLeadAction} className="grid gap-2 rounded-md border border-neutral-200 p-3 sm:grid-cols-2">
              <input type="hidden" name="lead_id" value={lead.id} />
              <div className="space-y-1">
                <label htmlFor="action_type" className="text-sm text-neutral-500">
                  Tipo de ação
                </label>
                <select
                  id="action_type"
                  name="action_type"
                  defaultValue="abordado"
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Data da ação" name="action_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              <div className="sm:col-span-2">
                <TextAreaField label="Observação" name="notes" rows={2} />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-fox-cream">
                  Adicionar ação
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
