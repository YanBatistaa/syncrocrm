import { Calendar, AlertCircle } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";

export function DeadlineBadge({ deadline }: { deadline: string | null }) {
    if (!deadline) return <span className="text-muted-foreground text-xs">—</span>;
    const days = differenceInDays(parseISO(deadline), new Date());
    let color = "text-green-400";
    if (days < 0) color = "text-red-400";
    else if (days <= 7) color = "text-yellow-400";
    return (
        <div className={`flex items-center gap-1.5 text-xs ${color}`}>
            <Calendar className="w-3 h-3" />
            {format(parseISO(deadline), "dd/MM/yyyy")}
            {days < 0 && <AlertCircle className="w-3 h-3" />}
        </div>
    );
}
