import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { EMPTY_DEAL_FORM } from "./LeadForm";

interface DealFormProps {
    form: typeof EMPTY_DEAL_FORM;
    onChange: (f: typeof EMPTY_DEAL_FORM) => void;
    onSave: () => void;
    isSaving: boolean;
}

export function DealForm({ form, onChange, onSave, isSaving }: DealFormProps) {
    return (
        <div className="mb-3 p-3 rounded-lg bg-background border border-border/60 space-y-2">
            <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Título do Projeto</Label>
                <Input
                    placeholder="Ex: Landing Page"
                    value={form.title}
                    onChange={(e) => onChange({ ...form, title: e.target.value })}
                    className="bg-card border-border/60 text-sm"
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                    <Input
                        placeholder="0,00"
                        type="number"
                        value={form.value}
                        onChange={(e) => onChange({ ...form, value: e.target.value })}
                        className="bg-card border-border/60 text-sm"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Estágio</Label>
                    <Select
                        value={form.stage}
                        onValueChange={(v) => onChange({ ...form, stage: v as typeof form.stage })}
                    >
                        <SelectTrigger className="bg-card border-border/60 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="prospect">Prospect</SelectItem>
                            <SelectItem value="negotiation">Negociação</SelectItem>
                            <SelectItem value="closed">Fechado ✓</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Button size="sm" onClick={onSave} disabled={isSaving} className="w-full">
                {isSaving ? "Salvando..." : "Salvar Deal"}
            </Button>
        </div>
    );
}
