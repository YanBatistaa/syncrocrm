import { useMemo } from "react";
import { Github, Building2, DollarSign, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lead } from "@/hooks/useLeads";
import { useDeals } from "@/hooks/useDeals";
import { DeadlineBadge } from "./DeadlineBadge";
import { StatusQuickChange } from "./StatusQuickChange";

interface LeadTableRowProps {
    lead: Lead;
    onClick: () => void;
    onStatusChange: (v: string) => void;
    onDelete: () => void;
}

export function LeadTableRow({ lead, onClick, onStatusChange, onDelete }: LeadTableRowProps) {
    const { data: deals = [] } = useDeals(lead.id);
    const totalValue = useMemo(
        () => deals.reduce((acc, d) => acc + (d.value ?? 0), 0),
        [deals]
    );

    return (
        <tr className="hover:bg-muted/20 cursor-pointer transition-colors" onClick={onClick}>
            <td className="p-3 font-medium text-foreground">{lead.name}</td>
            <td className="p-3 text-muted-foreground">
                {lead.company && (
                    <div className="flex items-center gap-1.5">
                        <Building2 className="w-3 h-3" />
                        {lead.company}
                    </div>
                )}
            </td>
            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                <StatusQuickChange status={lead.status} onChange={onStatusChange} />
            </td>
            <td className="p-3">
                <DeadlineBadge deadline={lead.deadline} />
            </td>
            <td className="p-3">
                {totalValue > 0 ? (
                    <div className="flex items-center gap-1 text-xs text-primary font-medium">
                        <DollarSign className="w-3 h-3" />
                        {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        {deals.length > 1 && (
                            <span className="text-muted-foreground font-normal">({deals.length})</span>
                        )}
                    </div>
                ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                )}
            </td>
            <td className="p-3">
                {lead.github_sync ? (
                    <Github className="w-4 h-4 text-primary" />
                ) : (
                    <Github className="w-4 h-4 text-muted-foreground/30" />
                )}
            </td>
            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={onDelete}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </td>
        </tr>
    );
}
