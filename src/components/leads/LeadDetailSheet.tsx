import { useState, useMemo } from "react";
import { Github, RefreshCw, Plus, DollarSign, Briefcase } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
import { Lead } from "@/hooks/useLeads";
import { useDeals, useCreateDeal, useDeleteDeal } from "@/hooks/useDeals";
import { useGithubIssues, useSyncGithubIssues } from "@/hooks/useGithubIssues";
import { CopyButton } from "./CopyButton";
import { DealForm } from "./DealForm";
import { DealItem } from "./DealItem";
import { IssueItem } from "./IssueItem";
import { EMPTY_DEAL_FORM } from "./LeadForm";

interface LeadDetailSheetProps {
    lead: Lead;
    editForm: Partial<Lead>;
    onEditFormChange: (f: Partial<Lead>) => void;
    onSave: () => void;
    onClose: () => void;
    isSaving: boolean;
}

export function LeadDetailSheet({
    lead,
    editForm,
    onEditFormChange,
    onSave,
    onClose,
    isSaving,
}: LeadDetailSheetProps) {
    const set = (key: keyof Lead, val: string | boolean | null) =>
        onEditFormChange({ ...editForm, [key]: val });

    const { data: deals = [] } = useDeals(lead.id);
    const { data: issues = [] } = useGithubIssues(lead.id);
    const createDeal = useCreateDeal();
    const deleteDeal = useDeleteDeal();
    const syncIssues = useSyncGithubIssues();

    const [dealForm, setDealForm] = useState(EMPTY_DEAL_FORM);
    const [showDealForm, setShowDealForm] = useState(false);

    const totalDealsValue = useMemo(
        () => deals.reduce((acc, d) => acc + (d.value ?? 0), 0),
        [deals]
    );

    const handleAddDeal = async () => {
        if (!dealForm.title.trim()) return;
        await createDeal.mutateAsync({
            lead_id: lead.id,
            title: dealForm.title,
            value: parseFloat(dealForm.value) || 0,
            stage: dealForm.stage,
        });
        setDealForm(EMPTY_DEAL_FORM);
        setShowDealForm(false);
    };

    const handleSync = () => {
        const repoUrl = editForm.repo_url || lead.repo_url;
        if (!repoUrl) return;
        syncIssues.mutate({ repoUrl, leadId: lead.id });
    };

    return (
        <Sheet open={!!lead} onOpenChange={onClose}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-xl bg-card border-l border-border/60 overflow-y-auto"
            >
                <SheetHeader className="mb-4">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <SheetTitle className="text-foreground">{lead.name}</SheetTitle>
                            <SheetDescription>{lead.company}</SheetDescription>
                        </div>
                        {totalDealsValue > 0 && (
                            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-md text-xs font-semibold shrink-0">
                                <DollarSign className="w-3.5 h-3.5" />
                                R$ {totalDealsValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                        )}
                    </div>
                </SheetHeader>

                {/* Edit Form */}
                <div className="space-y-3 mb-6">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Nome</Label>
                            <Input
                                value={editForm.name ?? ""}
                                onChange={(e) => set("name", e.target.value)}
                                className="bg-background border-border/60 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Empresa</Label>
                            <Input
                                value={editForm.company ?? ""}
                                onChange={(e) => set("company", e.target.value)}
                                className="bg-background border-border/60 text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Repo URL</Label>
                        <div className="flex gap-2">
                            <Input
                                value={editForm.repo_url ?? ""}
                                onChange={(e) => set("repo_url", e.target.value)}
                                className="bg-background border-border/60 text-sm flex-1"
                                placeholder="github.com/user/repo"
                            />
                            {(editForm.repo_url || lead.repo_url) && (
                                <CopyButton text={editForm.repo_url || lead.repo_url || ""} />
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Status</Label>
                            <Select value={editForm.status} onValueChange={(v) => set("status", v)}>
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
                                value={editForm.deadline ?? ""}
                                onChange={(e) => set("deadline", e.target.value || null)}
                                className="bg-background border-border/60 text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Notas</Label>
                        <Textarea
                            value={editForm.notes ?? ""}
                            onChange={(e) => set("notes", e.target.value)}
                            className="bg-background border-border/60 text-sm resize-none"
                            rows={3}
                        />
                    </div>

                    <Button size="sm" onClick={onSave} disabled={isSaving} className="w-full">
                        {isSaving ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </div>

                {/* Deals */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" />
                            Deals
                            {deals.length > 0 && (
                                <span className="bg-muted/40 text-muted-foreground px-1.5 py-0.5 rounded text-xs">
                                    {deals.length}
                                </span>
                            )}
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setShowDealForm(!showDealForm)}
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            Adicionar
                        </Button>
                    </div>

                    {showDealForm && (
                        <DealForm
                            form={dealForm}
                            onChange={setDealForm}
                            onSave={handleAddDeal}
                            isSaving={createDeal.isPending}
                        />
                    )}

                    <div className="space-y-2">
                        {deals.map((deal) => (
                            <DealItem key={deal.id} deal={deal} onDelete={() => deleteDeal.mutate(deal.id)} />
                        ))}
                        {deals.length === 0 && (
                            <p className="text-xs text-muted-foreground/50 text-center py-2">
                                Nenhum deal ainda
                            </p>
                        )}
                    </div>
                </div>

                {/* GitHub Issues */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            GitHub Issues
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-border/60"
                            onClick={handleSync}
                            disabled={syncIssues.isPending || !editForm.repo_url}
                        >
                            {syncIssues.isPending ? (
                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                                <Github className="w-3 h-3 mr-1" />
                            )}
                            Sync Issues
                        </Button>
                    </div>
                    {!editForm.repo_url && (
                        <p className="text-xs text-muted-foreground/50 mb-2">
                            Adicione um repo URL para sincronizar
                        </p>
                    )}
                    <div className="space-y-1.5">
                        {issues.slice(0, 10).map((issue) => (
                            <IssueItem key={issue.id} issue={issue} />
                        ))}
                        {issues.length === 0 && (
                            <p className="text-xs text-muted-foreground/50 text-center py-2">
                                Nenhuma issue sincronizada
                            </p>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
