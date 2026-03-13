import { LeadStatus } from "@/hooks/useLeads";

// Fonte única de verdade para os status do funil de outreach (Issue #1)
// Usada em LeadForm, LeadTableRow, LeadDetailSheet e Leads.tsx
export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "prospectado",   label: "Prospectado" },
  { value: "demo-criada",   label: "Demo Criada" },
  { value: "email-enviado", label: "Email Enviado" },
  { value: "follow-up-1",   label: "Follow-up 1" },
  { value: "follow-up-2",   label: "Follow-up 2" },
  { value: "fechado",       label: "Fechado" },
  { value: "recusado",      label: "Recusado" },
];

// Retorna label legível para qualquer status, incluindo valores legados
export function getStatusLabel(status: LeadStatus): string {
  const found = LEAD_STATUSES.find((s) => s.value === status);
  if (found) return found.label;
  // Fallback para valores antigos que ainda possam existir no banco
  const legacy: Record<string, string> = {
    new: "Novo",
    "in-progress": "Em Progresso",
    done: "Concluído",
  };
  return legacy[status] ?? status;
}

// Cores por status para badges
export function getStatusColor(status: LeadStatus): string {
  switch (status) {
    case "prospectado":   return "bg-blue-500/15 text-blue-400";
    case "demo-criada":   return "bg-violet-500/15 text-violet-400";
    case "email-enviado": return "bg-yellow-500/15 text-yellow-400";
    case "follow-up-1":   return "bg-orange-500/15 text-orange-400";
    case "follow-up-2":   return "bg-red-500/15 text-red-400";
    case "fechado":       return "bg-green-500/15 text-green-400";
    case "recusado":      return "bg-muted/40 text-muted-foreground";
    // legados
    case "new":           return "bg-blue-500/15 text-blue-400";
    case "in-progress":   return "bg-yellow-500/15 text-yellow-400";
    case "done":          return "bg-green-500/15 text-green-400";
    default:              return "bg-muted/40 text-muted-foreground";
  }
}
