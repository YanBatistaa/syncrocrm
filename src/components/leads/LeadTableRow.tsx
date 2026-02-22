import { format, parseISO, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, ExternalLink, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { Lead } from "@/hooks/useLeads";
import { useDeals } from "@/hooks/useDeals";

interface LeadTableRowProps {
  lead: Lead;
  onClick: () => void;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
}

export function LeadTableRow({ lead, onClick, onStatusChange, onDelete }: LeadTableRowProps) {
  const { data: deals = [] } = useDeals(lead.id);
  const totalValue = deals.reduce((acc, d) => acc + (d.value ?? 0), 0);

  const isOverdue =
    lead.deadline &&
    isBefore(parseISO(lead.deadline), new Date()) &&
    lead.status !== "done";

  const isDueSoon =
    lead.deadline &&
    !isOverdue &&
    isBefore(parseISO(lead.deadline), addDays(new Date(), 3)) &&
    lead.status !== "done";

  return (
    <tr
      className={`hover:bg-muted/20 cursor-pointer transition-colors ${
        lead.archived ? "opacity-50" : ""
      }`}
      onClick={onClick}
    >
      <td className="p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{lead.name}</span>
          {lead.archived && <Archive className="w-3 h-3 text-muted-foreground/50" />}
        </div>
      </td>
      <td className="p-3">
        <span className="text-xs text-muted-foreground">{lead.company ?? "—"}</span>
      </td>
      {/* Tags */}
      <td className="p-3">
        <div className="flex flex-wrap gap-1">
          {(lead.tags ?? []).slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
          {(lead.tags ?? []).length > 2 && (
            <span className="text-xs text-muted-foreground/60">+{(lead.tags ?? []).length - 2}</span>
          )}
        </div>
      </td>
      <td className="p-3" onClick={(e) => e.stopPropagation()}>
        <Select value={lead.status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-7 text-xs bg-transparent border-none p-0 w-fit gap-1 focus:ring-0">
            <SelectValue>
              <StatusBadge status={lead.status} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Novo</SelectItem>
            <SelectItem value="in-progress">Em Progresso</SelectItem>
            <SelectItem value="done">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="p-3">
        {lead.deadline ? (
          <span
            className={`text-xs ${
              isOverdue
                ? "text-destructive font-semibold"
                : isDueSoon
                ? "text-[hsl(var(--status-progress))] font-medium"
                : "text-muted-foreground"
            }`}
          >
            {format(parseISO(lead.deadline), "dd/MM/yy", { locale: ptBR })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="p-3">
        {totalValue > 0 ? (
          <span className="text-xs font-medium text-primary">
            R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="p-3">
        {lead.repo_url ? (
          <a
            href={lead.repo_url.startsWith("http") ? lead.repo_url : `https://${lead.repo_url}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="p-3" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </td>
    </tr>
  );
}
