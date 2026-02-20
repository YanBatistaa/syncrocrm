import { cn } from "@/lib/utils";

type Status = "new" | "in-progress" | "done" | "idea" | "dev" | "test" | "prospect" | "negotiation" | "closed";

const CONFIG: Record<Status, { label: string; className: string }> = {
  new: { label: "Novo", className: "status-new border" },
  "in-progress": { label: "Em Progresso", className: "status-progress border" },
  done: { label: "Concluído", className: "status-done border" },
  idea: { label: "Ideia", className: "border border-muted-foreground/40 text-muted-foreground bg-muted/30" },
  dev: { label: "Dev", className: "status-new border" },
  test: { label: "Teste", className: "status-progress border" },
  prospect: { label: "Prospect", className: "border border-[hsl(var(--chart-2)/0.5)] text-[hsl(var(--chart-2))] bg-[hsl(var(--chart-2)/0.1)]" },
  negotiation: { label: "Negociação", className: "status-progress border" },
  closed: { label: "Fechado", className: "status-done border" },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status as Status] ?? { label: status, className: "border border-border text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", cfg.className)}>
      {cfg.label}
    </span>
  );
}
