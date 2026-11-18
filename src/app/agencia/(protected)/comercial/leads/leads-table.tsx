"use client";

import { useState } from "react";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_STYLES,
  TEMPERATURE_LABELS,
  TEMPERATURE_STYLES,
} from "@/lib/comercial/calc";
import { LeadModal, type Lead, type LeadAction } from "./lead-modal";

function formatCents(cents: number | null) {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function NewLeadButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-fox-orange px-4 py-2 text-sm font-medium text-white hover:bg-fox-orange-dark"
      >
        Novo lead
      </button>
      {open && <LeadModal onClose={() => setOpen(false)} />}
    </>
  );
}

export function LeadsTable({
  leads,
  actionsByLead,
}: {
  leads: Lead[];
  actionsByLead: Record<string, LeadAction[]>;
}) {
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const openLead = leads.find((l) => l.id === openLeadId);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Profissão</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Temperatura</th>
              <th className="px-3 py-2">Próxima ação</th>
              <th className="px-3 py-2">Valor potencial</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => setOpenLeadId(lead.id)}
                className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-fox-cream"
              >
                <td className="px-3 py-2 font-medium">{lead.name}</td>
                <td className="px-3 py-2 text-neutral-500">{lead.profession || "—"}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEAD_STATUS_STYLES[lead.status as keyof typeof LEAD_STATUS_STYLES]}`}>
                    {LEAD_STATUS_LABELS[lead.status as keyof typeof LEAD_STATUS_LABELS] ?? lead.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {lead.temperature ? (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TEMPERATURE_STYLES[lead.temperature]}`}>
                      {TEMPERATURE_LABELS[lead.temperature]}
                    </span>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-neutral-500">
                  {lead.next_action_date
                    ? new Date(lead.next_action_date + "T00:00:00").toLocaleDateString("pt-BR")
                    : "—"}
                </td>
                <td className="px-3 py-2">{formatCents(lead.potential_value_cents)}</td>
              </tr>
            ))}
            {!leads.length && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-neutral-500">
                  Nenhum lead encontrado com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openLead && (
        <LeadModal
          lead={openLead}
          actions={actionsByLead[openLead.id] ?? []}
          onClose={() => setOpenLeadId(null)}
        />
      )}
    </>
  );
}
