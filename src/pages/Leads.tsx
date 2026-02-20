import { useState } from "react";
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, Lead, LeadInsert } from "@/hooks/useLeads";
import { useDeals, useCreateDeal, useDeleteDeal } from "@/hooks/useDeals";
import { useGithubIssues, useSyncGithubIssues } from "@/hooks/useGithubIssues";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import { Plus, Trash2, Github, RefreshCw, ExternalLink, Calendar, Building2 } from "lucide-react";
import { format, parseISO } from "date-fns";

const EMPTY_LEAD: LeadInsert = {
  name: "", company: "", repo_url: "", status: "new", deadline: null, notes: "", github_sync: false,
};

export default function Leads() {
  const { data: leads = [], isLoading } = useLeads();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<LeadInsert>(EMPTY_LEAD);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.company ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await createLead.mutateAsync(form);
    setForm(EMPTY_LEAD);
    setShowCreate(false);
  };

  const handleUpdate = async () => {
    if (!selectedLead) return;
    await updateLead.mutateAsync({ id: selectedLead.id, ...editForm });
    setSelectedLead(null);
  };

  const openLead = (lead: Lead) => {
    setSelectedLead(lead);
    setEditForm({
      name: lead.name,
      company: lead.company ?? "",
      repo_url: lead.repo_url ?? "",
      status: lead.status,
      deadline: lead.deadline,
      notes: lead.notes ?? "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">{leads.length} leads cadastrados</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="glow-primary">
          <Plus className="w-4 h-4" />
          Novo Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Buscar por nome ou empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-card border-border/60 text-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-card border-border/60 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="new">Novo</SelectItem>
            <SelectItem value="in-progress">Em Progresso</SelectItem>
            <SelectItem value="done">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/60 card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Empresa</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prazo</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">GitHub</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                    Carregando...
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                    Nenhum lead encontrado
                  </td>
                </tr>
              )}
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => openLead(lead)}
                >
                  <td className="p-3 font-medium text-foreground">{lead.name}</td>
                  <td className="p-3 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      {lead.company && <Building2 className="w-3 h-3" />}
                      {lead.company || "—"}
                    </div>
                  </td>
                  <td className="p-3"><StatusBadge status={lead.status} /></td>
                  <td className="p-3 text-muted-foreground">
                    {lead.deadline ? (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(lead.deadline), "dd/MM/yyyy")}
                      </div>
                    ) : "—"}
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
                      onClick={() => deleteLead.mutate(lead.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border/60 max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
            <DialogDescription>Adicione um novo lead ao seu pipeline</DialogDescription>
          </DialogHeader>
          <LeadForm form={form} onChange={setForm} />
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={createLead.isPending}>
              {createLead.isPending ? "Salvando..." : "Criar Lead"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      {selectedLead && (
        <LeadDetailSheet
          lead={selectedLead}
          editForm={editForm}
          onEditFormChange={setEditForm}
          onSave={handleUpdate}
          onClose={() => setSelectedLead(null)}
          isSaving={updateLead.isPending}
        />
      )}
    </div>
  );
}

function LeadForm({
  form,
  onChange,
}: {
  form: LeadInsert;
  onChange: (f: LeadInsert) => void;
}) {
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
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Repo URL (GitHub)</Label>
        <Input
          value={form.repo_url ?? ""}
          onChange={(e) => set("repo_url", e.target.value)}
          className="bg-background border-border/60 text-sm"
          placeholder="github.com/user/repo"
        />
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
    </div>
  );
}

function LeadDetailSheet({
  lead,
  editForm,
  onEditFormChange,
  onSave,
  onClose,
  isSaving,
}: {
  lead: Lead;
  editForm: Partial<Lead>;
  onEditFormChange: (f: Partial<Lead>) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const set = (key: keyof Lead, val: string | boolean | null) =>
    onEditFormChange({ ...editForm, [key]: val });

  const { data: deals = [] } = useDeals(lead.id);
  const { data: issues = [] } = useGithubIssues(lead.id);
  const createDeal = useCreateDeal();
  const deleteDeal = useDeleteDeal();
  const syncIssues = useSyncGithubIssues();

  const [dealForm, setDealForm] = useState({ title: "", value: "", stage: "prospect" as const });
  const [showDealForm, setShowDealForm] = useState(false);

  const handleAddDeal = async () => {
    if (!dealForm.title.trim()) return;
    await createDeal.mutateAsync({
      lead_id: lead.id,
      title: dealForm.title,
      value: parseFloat(dealForm.value) || 0,
      stage: dealForm.stage,
    });
    setDealForm({ title: "", value: "", stage: "prospect" });
    setShowDealForm(false);
  };

  const handleSync = () => {
    if (!editForm.repo_url && !lead.repo_url) return;
    syncIssues.mutate({ repoUrl: (editForm.repo_url || lead.repo_url)!, leadId: lead.id });
  };

  return (
    <Sheet open={!!lead} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-card border-l border-border/60 overflow-y-auto"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-foreground">{lead.name}</SheetTitle>
          <SheetDescription>{lead.company}</SheetDescription>
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
            <Input
              value={editForm.repo_url ?? ""}
              onChange={(e) => set("repo_url", e.target.value)}
              className="bg-background border-border/60 text-sm"
              placeholder="github.com/user/repo"
            />
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
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deals</h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowDealForm(!showDealForm)}>
              <Plus className="w-3 h-3 mr-1" /> Adicionar
            </Button>
          </div>
          {showDealForm && (
            <div className="mb-3 p-3 rounded-lg bg-background border border-border/60 space-y-2">
              <Input
                placeholder="Título do deal"
                value={dealForm.title}
                onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                className="bg-card border-border/60 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Valor R$"
                  type="number"
                  value={dealForm.value}
                  onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })}
                  className="bg-card border-border/60 text-sm"
                />
                <Select value={dealForm.stage} onValueChange={(v) => setDealForm({ ...dealForm, stage: v as typeof dealForm.stage })}>
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
              <Button size="sm" onClick={handleAddDeal} disabled={createDeal.isPending} className="w-full">
                Salvar Deal
              </Button>
            </div>
          )}
          <div className="space-y-2">
            {deals.map((deal) => (
              <div key={deal.id} className="flex items-center justify-between p-2.5 rounded-md bg-background border border-border/60">
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
                    onClick={() => deleteDeal.mutate(deal.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            {deals.length === 0 && (
              <p className="text-xs text-muted-foreground/50 text-center py-2">Nenhum deal ainda</p>
            )}
          </div>
        </div>

        {/* GitHub Issues */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">GitHub Issues</h3>
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
            <p className="text-xs text-muted-foreground/50 mb-2">Adicione um repo URL para sincronizar</p>
          )}
          <div className="space-y-1.5">
            {issues.slice(0, 10).map((issue) => (
              <div key={issue.id} className="flex items-start justify-between gap-2 p-2 rounded bg-background border border-border/60">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">#{issue.gh_id} {issue.title}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${issue.state === "open" ? "text-[hsl(var(--status-done))] bg-[hsl(var(--status-done)/0.1)]" : "text-muted-foreground bg-muted/30"}`}>
                    {issue.state}
                  </span>
                  {issue.url && (
                    <a href={issue.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                      <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
                    </a>
                  )}
                </div>
              </div>
            ))}
            {issues.length === 0 && (
              <p className="text-xs text-muted-foreground/50 text-center py-2">Nenhuma issue sincronizada</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
