import { useState, useMemo } from "react";
import { Github, RefreshCw, Plus, DollarSign, Briefcase, Mail, Phone, Archive, ArchiveRestore, X, Tag } from "lucide-react";
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
import { useArchiveLead } from "@/hooks/useLeads";
import { useDeals, useCreateDeal, useDeleteDeal } from "@/hooks/useDeals";
import { useGithubIssues, useSyncGithubIssues } from "@/hooks/useGithubIssues";
import { CopyButton } from "./CopyButton";
import { DealForm } from "./DealForm";
import { DealItem } from "./DealItem";
import { IssueItem } from "./IssueItem";
import { EMPTY_DEAL_FORM } from "./LeadForm";

const PRESET_TAGS = ["Web", "Roblox", "MU Online", "Landing Page", "Mobile", "API", "Automação", "Design"];

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
    const set = (key: keyof Lead, val: string | boolean | null | string[]) =>
        onEditFormChange({ ...editForm, [key]: val });

    const archiveLead = useArchiveLead();
    const { data: deals = [] } = useDeals(lead.id);
    const { data: issues = [] } = useGithubIssues(lead.id);
    const createDeal = useCreateDeal();
    const deleteDeal = useDeleteDeal();
    const syncIssues = useSyncGithubIssues();

    const [dealForm, setDealForm] = useState(EMPTY_DEAL_FORM);
    const [showDealForm, setShowDealForm] = useState(false);
    const [tagInput, setTagInput] = useState("");

    const currentTags: string[] = (editForm.tags as string[]) ?? lead.tags ?? [];

    const addTag = (tag: string) => {
        const t = tag.trim();
        if (!t || currentTags.includes(t)) return;
        set("tags", [...currentTags, t]);
        setTagInput("");
    };

    const removeTag = (tag: string) => {
        set("tags", currentTags.filter((t) => t !== tag));
    };

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

    const handleArchive = () => {
        archiveLead.mutate({ id: lead.id, archived: !lead.archived }, { onSuccess: onClose });
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
                            <SheetTitle className="text-foreground flex items-center gap-2">
                                {lead.name}
                                {lead.archived && (
                                    <span className="text-xs bg-muted/60 text-muted-foreground px-2 py-0.5 rounded">Arquivado</span>
                                )}
                            </SheetTitle>
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

                    {/* Contatos */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Email
                            </Label>
                            <div className="flex gap-1">
                                <Input
                                    type="email"
                                    value={editForm.email ?? ""}
                                    onChange={(e) => set("email", e.target.value)}
                                    className="bg-background border-border/60 text-sm"
                                    placeholder="cliente@email.com"
                                />
                                {editForm.email && (
                                    <a
                                        href={`mailto:${editForm.email}`}
                                        className="flex items-center px-2 rounded-md border border-border/60 bg-background text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <Mail className="w-3.5 h-3.5" />
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" /> WhatsApp / Tel
                            </Label>
                            <div className="flex gap-1">
                                <Input
                                    type="tel"
                                    value={editForm.phone ?? ""}
                                    onChange={(e) => set("phone", e.target.value)}
                                    className="bg-background border-border/60 text-sm"
                                    placeholder="+55 11 9 0000-0000"
                                />
                                {editForm.phone && (
                                    <a
                                        href={`https://wa.me/${(editForm.phone ?? "").replace(/\D/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center px-2 rounded-md border border-border/60 bg-background text-muted-foreground hover:text-[#25D366] transition-colors"
                                    >
                                        <Phone className="w-3.5 h-3.5" />
                                    </a>
                                )}
                            </div>
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

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Tag className="w-3 h-3" /> Tags
                        </Label>
                        {/* Tags atuais */}
                        {currentTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {currentTags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                                    >
                                        {tag}
                                        <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        {/* Sugestões */}
                        <div className="flex flex-wrap gap-1">
                            {PRESET_TAGS.filter((t) => !currentTags.includes(t)).map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => addTag(tag)}
                                    className="text-xs border border-dashed border-border/60 text-muted-foreground px-2 py-0.5 rounded-full hover:border-primary/40 hover:text-primary transition-colors"
                                >
                                    + {tag}
                                </button>
                            ))}
                        </div>
                        {/* Input personalizado */}
                        <div className="flex gap-2">
                            <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
                                className="bg-background border-border/60 text-sm h-7"
                                placeholder="Nova tag personalizada..."
                            />
                            <Button size="sm" variant="outline" className="h-7 px-2 border-border/60" onClick={() => addTag(tagInput)}>
                                <Plus className="w-3 h-3" />
                            </Button>
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

                    <div className="flex gap-2">
                        <Button size="sm" onClick={onSave} disabled={isSaving} className="flex-1">
                            {isSaving ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-border/60"
                            onClick={handleArchive}
                            disabled={archiveLead.isPending}
                            title={lead.archived ? "Restaurar lead" : "Arquivar lead"}
                        >
                            {lead.archived
                                ? <ArchiveRestore className="w-3.5 h-3.5" />
                                : <Archive className="w-3.5 h-3.5" />
                            }
                        </Button>
                    </div>
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
