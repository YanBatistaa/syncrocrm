import { useState } from "react";
import {
  useProjetos,
  useCreateProjeto,
  useUpdateProjeto,
  useDeleteProjeto,
  Projeto,
  ProjetoInsert,
} from "@/hooks/useProjetos";
import { useAllDealsWithLead, DealWithLead } from "@/hooks/useDeals";
import { useGithubIssues, useSyncGithubIssues } from "@/hooks/useGithubIssues";
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
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Plus,
  Trash2,
  Edit2,
  Github,
  RefreshCw,
  ExternalLink,
  FolderGit2,
  User,
  Briefcase,
  DollarSign,
} from "lucide-react";

const KANBAN_COLS = [
  { key: "idea", label: "Ideia", color: "hsl(var(--muted-foreground))" },
  { key: "dev", label: "Dev", color: "hsl(var(--status-new))" },
  { key: "test", label: "Teste", color: "hsl(var(--status-progress))" },
  { key: "done", label: "Feito", color: "hsl(var(--status-done))" },
] as const;

const STAGE_LABELS: Record<string, string> = {
  prospect: "Prospect",
  negotiation: "Negociação",
  closed: "Fechado",
};

const STAGE_COLORS: Record<string, string> = {
  prospect: "hsl(var(--muted-foreground))",
  negotiation: "hsl(var(--status-progress))",
  closed: "hsl(var(--status-done))",
};

const EMPTY_FORM: ProjetoInsert = {
  name: "",
  repo_url: "",
  status: "idea",
  progress: 0,
  notes: "",
};

export default function Projetos() {
  const { data: projetos = [], isLoading } = useProjetos();
  const { data: dealsWithLead = [], isLoading: isLoadingDeals } = useAllDealsWithLead();
  const createProjeto = useCreateProjeto();
  const updateProjeto = useUpdateProjeto();
  const deleteProjeto = useDeleteProjeto();

  const [showModal, setShowModal] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<Projeto | null>(null);
  const [selectedProjeto, setSelectedProjeto] = useState<Projeto | null>(null);
  const [form, setForm] = useState<ProjetoInsert>(EMPTY_FORM);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const syncIssues = useSyncGithubIssues();

  // Agrupa deals por lead
  const dealsByLead = dealsWithLead.reduce<Record<number, DealWithLead[]>>((acc, deal) => {
    if (!acc[deal.lead_id]) acc[deal.lead_id] = [];
    acc[deal.lead_id].push(deal);
    return acc;
  }, {});

  const openCreate = () => {
    setEditingProjeto(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (p: Projeto) => {
    setEditingProjeto(p);
    setForm({
      name: p.name,
      repo_url: p.repo_url ?? "",
      status: p.status,
      progress: p.progress,
      notes: p.notes ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    if (editingProjeto) {
      await updateProjeto.mutateAsync({ id: editingProjeto.id, ...form });
    } else {
      await createProjeto.mutateAsync(form);
    }
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  const handleSync = async (p: Projeto) => {
    if (!p.repo_url) return;
    setSyncingId(p.id);
    await syncIssues.mutateAsync({ repoUrl: p.repo_url, projetoId: p.id });
    setSyncingId(null);
  };

  const set = (key: keyof ProjetoInsert, val: string | number | null) =>
    setForm((f) => ({ ...f, [key]: val }));

  const isLoadingAll = isLoading || isLoadingDeals;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projetos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {projetos.length} pessoais · {Object.keys(dealsByLead).length} clientes
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="glow-primary">
          <Plus className="w-4 h-4" />
          Novo Projeto
        </Button>
      </div>

      {isLoadingAll ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
      ) : (
        <div className="space-y-10">

          {/* ── Seção Clientes: Deals agrupados por lead ── */}
          {Object.keys(dealsByLead).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Briefcase className="w-3.5 h-3.5" />
                Projetos de Clientes
                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  {dealsWithLead.length} deals
                </span>
              </div>

              <div className="space-y-4">
                {Object.entries(dealsByLead).map(([, deals]) => {
                  const leadName = deals[0].lead_name;
                  const leadCompany = deals[0].lead_company;
                  const totalValue = deals.reduce((a, d) => a + (d.value || 0), 0);

                  return (
                    <div
                      key={deals[0].lead_id}
                      className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-3"
                    >
                      {/* Lead header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-primary" />
                          <span className="text-sm font-semibold text-foreground">{leadName}</span>
                          {leadCompany && (
                            <span className="text-xs text-muted-foreground">· {leadCompany}</span>
                          )}
                        </div>
                        {totalValue > 0 && (
                          <div className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                            <DollarSign className="w-3 h-3" />
                            R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>

                      {/* Deals do lead */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {deals.map((deal) => (
                          <div
                            key={deal.id}
                            className="rounded-md bg-card border border-border/60 p-3 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-medium text-foreground truncate flex-1">
                                {deal.title}
                              </p>
                              <span
                                className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 font-medium"
                                style={{
                                  color: STAGE_COLORS[deal.stage],
                                  background: `${STAGE_COLORS[deal.stage]}20`,
                                }}
                              >
                                {STAGE_LABELS[deal.stage]}
                              </span>
                            </div>
                            {deal.value > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <DollarSign className="w-3 h-3" />
                                R$ {deal.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Seção Pessoais: projetos_pessoais ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              Projetos Pessoais
              <span className="bg-muted/40 text-muted-foreground px-1.5 py-0.5 rounded">
                {projetos.length}
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {KANBAN_COLS.map((col) => {
                const items = projetos.filter((p) => p.status === col.key);
                return (
                  <KanbanCol
                    key={col.key}
                    col={col}
                    items={items}
                    syncingId={syncingId}
                    onEdit={openEdit}
                    onDelete={(id) => deleteProjeto.mutate(id)}
                    onSync={handleSync}
                    onSelect={setSelectedProjeto}
                  />
                );
              })}
            </div>
            {projetos.length === 0 && (
              <div className="text-center py-10 text-muted-foreground/50 text-sm">
                Nenhum projeto pessoal ainda. Crie um!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border/60 max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProjeto ? "Editar Projeto" : "Novo Projeto Pessoal"}</DialogTitle>
            <DialogDescription>
              {editingProjeto ? "Atualize os detalhes do projeto" : "Adicione um novo projeto pessoal"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="bg-background border-border/60 text-sm"
                placeholder="Meu projeto"
              />
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
                    <SelectItem value="idea">Ideia</SelectItem>
                    <SelectItem value="dev">Dev</SelectItem>
                    <SelectItem value="test">Teste</SelectItem>
                    <SelectItem value="done">Feito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Progresso: {form.progress}%</Label>
                <Slider
                  value={[form.progress]}
                  onValueChange={([v]) => set("progress", v)}
                  min={0}
                  max={100}
                  step={5}
                  className="mt-3"
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
                placeholder="Detalhes, tech stack, próximos passos..."
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={createProjeto.isPending || updateProjeto.isPending}
            >
              {editingProjeto ? "Salvar" : "Criar Projeto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Projeto Drawer */}
      {selectedProjeto && (
        <ProjetoDrawer
          projeto={selectedProjeto}
          onClose={() => setSelectedProjeto(null)}
          onEdit={() => { openEdit(selectedProjeto); setSelectedProjeto(null); }}
          onSync={() => handleSync(selectedProjeto)}
          isSyncing={syncingId === selectedProjeto.id}
        />
      )}
    </div>
  );
}

// ─── Kanban Col (só Pessoais) ─────────────────────────────────────────────────
function KanbanCol({
  col, items, syncingId, onEdit, onDelete, onSync, onSelect,
}: {
  col: { key: string; label: string; color: string };
  items: Projeto[];
  syncingId: number | null;
  onEdit: (p: Projeto) => void;
  onDelete: (id: number) => void;
  onSync: (p: Projeto) => void;
  onSelect: (p: Projeto) => void;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-3 min-h-[120px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: col.color }}>
          {col.label}
        </span>
        <span
          className="text-xs rounded-full px-1.5 py-0.5 font-medium"
          style={{ color: col.color, background: `${col.color}20` }}
        >
          {items.length}
        </span>
      </div>
      <div className="space-y-3">
        {items.map((p) => (
          <ProjetoCard
            key={p.id}
            projeto={p}
            isSyncing={syncingId === p.id}
            onEdit={() => onEdit(p)}
            onDelete={() => onDelete(p.id)}
            onSync={() => onSync(p)}
            onClick={() => onSelect(p)}
          />
        ))}
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground/30 text-center py-6">Vazio</p>
        )}
      </div>
    </div>
  );
}

// ─── Projeto Card ─────────────────────────────────────────────────────────────
function ProjetoCard({
  projeto, isSyncing, onEdit, onDelete, onSync, onClick,
}: {
  projeto: Projeto;
  isSyncing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSync: () => void;
  onClick: () => void;
}) {
  const { data: issues = [] } = useGithubIssues(undefined, projeto.id);

  return (
    <div
      className="rounded-md bg-card border border-border/60 p-3 space-y-2.5 hover:border-border transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <FolderGit2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <p className="text-xs font-medium text-foreground truncate">{projeto.name}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit} className="p-1 hover:text-primary text-muted-foreground transition-colors">
            <Edit2 className="w-3 h-3" />
          </button>
          <button onClick={onDelete} className="p-1 hover:text-destructive text-muted-foreground transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Progresso</span>
          <span className="text-xs font-medium text-primary">{projeto.progress}%</span>
        </div>
        <Progress value={projeto.progress} className="h-1.5 bg-secondary" />
      </div>

      {projeto.repo_url && (
        <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <a
            href={projeto.repo_url.startsWith("http") ? projeto.repo_url : `https://${projeto.repo_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Github className="w-3 h-3" />
            <span className="truncate max-w-[80px]">repo</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
            {issues.length > 0 && <span>{issues.length} issues</span>}
          </button>
        </div>
      )}

      {projeto.notes && (
        <p className="text-xs text-muted-foreground/70 line-clamp-2">{projeto.notes}</p>
      )}
    </div>
  );
}

// ─── Projeto Drawer ───────────────────────────────────────────────────────────
function ProjetoDrawer({
  projeto, onClose, onEdit, onSync, isSyncing,
}: {
  projeto: Projeto;
  onClose: () => void;
  onEdit: () => void;
  onSync: () => void;
  isSyncing: boolean;
}) {
  const { data: issues = [] } = useGithubIssues(undefined, projeto.id);

  return (
    <Sheet open={!!projeto} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-card border-l border-border/60 overflow-y-auto">
        <SheetHeader className="mb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <SheetTitle className="text-foreground flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-muted-foreground" />
                {projeto.name}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-1 mt-1">
                <User className="w-3 h-3" /> Projeto Pessoal
              </SheetDescription>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 border-border/60" onClick={onEdit}>
              <Edit2 className="w-3 h-3 mr-1" /> Editar
            </Button>
          </div>
        </SheetHeader>

        <div className="mb-6 p-3 rounded-lg bg-background border border-border/60 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground font-medium">Progresso</span>
            <span className="text-sm font-bold text-primary">{projeto.progress}%</span>
          </div>
          <Progress value={projeto.progress} className="h-2 bg-secondary" />
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Status</span>
            <span className="capitalize text-foreground font-medium">{projeto.status}</span>
          </div>
          {projeto.repo_url && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Repositório</span>
              <a
                href={projeto.repo_url.startsWith("http") ? projeto.repo_url : `https://${projeto.repo_url}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <Github className="w-3 h-3" /> Ver repo <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          )}
        </div>

        {projeto.notes && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notas</h3>
            <p className="text-sm text-muted-foreground bg-background border border-border/60 rounded-lg p-3 leading-relaxed">
              {projeto.notes}
            </p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">GitHub Issues</h3>
            {projeto.repo_url && (
              <Button variant="outline" size="sm" className="h-7 text-xs border-border/60" onClick={onSync} disabled={isSyncing}>
                {isSyncing ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Github className="w-3 h-3 mr-1" />}
                Sync
              </Button>
            )}
          </div>
          <div className="space-y-1.5">
            {issues.slice(0, 10).map((issue) => (
              <div key={issue.id} className="flex items-start justify-between gap-2 p-2 rounded bg-background border border-border/60">
                <p className="text-xs text-foreground truncate flex-1">#{issue.gh_id} {issue.title}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    issue.state === "open"
                      ? "text-[hsl(var(--status-done))] bg-[hsl(var(--status-done)/0.1)]"
                      : "text-muted-foreground bg-muted/30"
                  }`}>{issue.state}</span>
                  {issue.url && (
                    <a href={issue.url} target="_blank" rel="noopener noreferrer">
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
