import { ChevronDown, DollarSign, Github } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LeadInsert } from "@/hooks/useLeads";

export const EMPTY_DEAL_FORM = {
    title: "",
    value: "",
    stage: "prospect" as "prospect" | "negotiation" | "closed",
    repo_url: "",
};

interface LeadFormProps {
    form: LeadInsert;
    onChange: (f: LeadInsert) => void;
    dealForm: typeof EMPTY_DEAL_FORM;
    onDealFormChange: (f: typeof EMPTY_DEAL_FORM) => void;
    showDealSection: boolean;
    onToggleDealSection: () => void;
}

export function LeadForm({
    form,
    onChange,
    dealForm,
    onDealFormChange,
    showDealSection,
    onToggleDealSection,
}: LeadFormProps) {
    const set = (key: keyof LeadInsert, val: string | boolean | null) =>
        onChange({ ...form, [key]: val });

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Nome *</Label>
                    <Input
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        className="bg-background border-border/60 text-sm"
                        placeholder="Cliente"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Empresa</Label>
                    <Input
                        value={form.company ?? ""}
                        onChange={(e) => set("company", e.target.value)}
                        className="bg-background border-border/60 text-sm"
                        placeholder="Startup XYZ"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select value={form.status} onValueChange={(v) => set("status", v)}>
                        <SelectTrigger className="bg-background border-border/60 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="new">Novo</SelectItem>
                            <SelectItem value="in-progress">Em Progresso</SelectItem>
                            <SelectItem value="done">Concluído</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Prazo</Label>
                    <Input
                        type="date"
                        value={form.deadline ?? ""}
                        onChange={(e) => set("deadline", e.target.value || null)}
                        className="bg-background border-border/60 text-sm"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Notas</Label>
                <Textarea
                    value={form.notes ?? ""}
                    onChange={(e) => set("notes", e.target.value)}
                    className="bg-background border-border/60 text-sm resize-none"
                    rows={3}
                    placeholder="Detalhes, contexto..."
                />
            </div>

            {/* Deal + Projeto Inicial */}
            <div className="border border-border/40 rounded-lg overflow-hidden">
                <button
                    type="button"
                    onClick={onToggleDealSection}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5" />
                        Deal + Projeto (opcional)
                    </span>
                    <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${showDealSection ? "rotate-180" : ""}`}
                    />
                </button>
                {showDealSection && (
                    <div className="p-3 space-y-2 bg-background">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Título do Projeto *</Label>
                            <Input
                                value={dealForm.title}
                                onChange={(e) => onDealFormChange({ ...dealForm, title: e.target.value })}
                                className="bg-card border-border/60 text-sm"
                                placeholder="Ex: Landing Page E-commerce"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                                <Input
                                    type="number"
                                    value={dealForm.value}
                                    onChange={(e) => onDealFormChange({ ...dealForm, value: e.target.value })}
                                    className="bg-card border-border/60 text-sm"
                                    placeholder="0,00"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Estágio</Label>
                                <Select
                                    value={dealForm.stage}
                                    onValueChange={(v) =>
                                        onDealFormChange({ ...dealForm, stage: v as typeof dealForm.stage })
                                    }
                                >
                                    <SelectTrigger className="bg-card border-border/60 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="prospect">Prospect</SelectItem>
                                        <SelectItem value="negotiation">Negociação</SelectItem>
                                        <SelectItem value="closed">Fechado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Github className="w-3 h-3" />
                                Repo URL (opcional)
                            </Label>
                            <Input
                                value={dealForm.repo_url}
                                onChange={(e) => onDealFormChange({ ...dealForm, repo_url: e.target.value })}
                                className="bg-card border-border/60 text-sm"
                                placeholder="github.com/user/repo"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
