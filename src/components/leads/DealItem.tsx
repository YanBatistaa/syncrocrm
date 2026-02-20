import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";


interface Deal {
    id: number;
    title: string;
    value: number;
    stage: string;
}

export function DealItem({
    deal,
    onDelete,
}: {
    deal: Deal;
    onDelete: (id: number) => void;
}) {
    return (
        <div className="flex items-center justify-between p-2.5 rounded-md bg-background border border-border/60">
            <div>
                <p className="text-xs font-medium text-foreground">{deal.title}</p>
                <p className="text-xs text-muted-foreground">
                    R$ {deal.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <StatusBadge status={deal.stage} />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(deal.id)}
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );
}
