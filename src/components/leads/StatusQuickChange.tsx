import { ChevronDown } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";


export function StatusQuickChange({
    status,
    onChange,
}: {
    status: string;
    onChange: (v: "new" | "in-progress" | "done") => void;
}) {
    return (
        <Select value={status} onValueChange={onChange}>
            <SelectTrigger
                className="h-6 w-auto border-none bg-transparent p-0 focus:ring-0 gap-1 [&>svg]:hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <StatusBadge status={status} />
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </SelectTrigger>
            <SelectContent onClick={(e) => e.stopPropagation()}>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="in-progress">Em Progresso</SelectItem>
                <SelectItem value="done">Concluído</SelectItem>
            </SelectContent>
        </Select>
    );
}
