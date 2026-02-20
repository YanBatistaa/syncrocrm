import { useState } from "react";
import { useProjetos, useCreateProjeto, useUpdateProjeto, useDeleteProjeto, Projeto, ProjetoInsert } from "@/hooks/useProjetos";
import { useGithubIssues, useSyncGithubIssues } from "@/hooks/useGithubIssues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import { Plus, Trash2, Edit2, Github, RefreshCw, ExternalLink, FolderGit2 } from "lucide-react";
import { format, parseISO } from "date-fns";

const KANBAN_COLS = [
  { key: "idea", label: "Ideia", color: "hsl(var(--muted-foreground))" },
  { key: "dev", label: "Dev", color: "hsl(var(--status-new))" },
  { key: "test", label: "Teste", color: "hsl(var(--status-progress))" },
  { key: "done", label: "Feito", color: "hsl(var(--status-done))" },
] as const;

const EMPTY_FORM: ProjetoInsert = {
  name: "", repo_url: "", status: "idea", progress: 0, notes: "",
};

export default function Projetos() {
  const { data: projetos = [], isLoading } = useProjetos();
  const createProjeto = useCreateProjeto();
  const updateProjeto = useUpdateProjeto();
  const deleteProjeto = useDeleteProjeto();

  const [showModal, setShowModal] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<Projeto | null>(null);
  const [form, setForm] = useState<ProjetoInsert>(EMPTY_FORM);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const syncIssues = useSyncGithubIssues();

  const openCreate = () => {
    setEditingProjeto(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (p: Projeto) => {
    setEditingProjeto(p);
    setForm({ name: p.name, repo_url: p.repo_url ?? "", status: p.status, progress: p.progress, notes: p.notes ?? "" });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projetos Pessoais</h1>
          <p className="text-muted-foreground text-sm mt-1">{projetos.length} projetos</p>
        </div>
        <Button onClick={openCreate} size="sm" className="glow-primary">
          <Plus className="w-4 h-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KANBAN_COLS.map((col) => {
            const items = projetos.filter((p) => p.status === col.key);
            return (
              <div key={col.key} className="rounded-lg border border-border/60 bg-card/30 p-3 kanban-col">
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
                      onEdit={() => openEdit(p)}
                      onDelete={() => deleteProjeto.mutate(p.id)}
                      onSync={() => handleSync(p)}
                    />
                  ))}
                  {items.length === 0 && (
                    <p className="text-xs text-muted-foreground/30 text-center py-6">Vazio</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border/60 max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProjeto ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
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
                placeholder="Roblox Script v2"
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
    </div>
  );
}

function ProjetoCard({
  projeto,
  isSyncing,
  onEdit,
  onDelete,
  onSync,
}: {
  projeto: Projeto;
  isSyncing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSync: () => void;
}) {
  const { data: issues = [] } = useGithubIssues(undefined, projeto.id);

  return (
    <div className="rounded-md bg-card border border-border/60 p-3 space-y-2.5 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <FolderGit2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <p className="text-xs font-medium text-foreground truncate">{projeto.name}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1 hover:text-primary text-muted-foreground transition-colors"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:text-destructive text-muted-foreground transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Progresso</span>
          <span className="text-xs font-medium text-primary">{projeto.progress}%</span>
        </div>
        <Progress
          value={projeto.progress}
          className="h-1.5 bg-secondary"
        />
      </div>

      {/* Repo + Sync */}
      {projeto.repo_url && (
        <div className="flex items-center justify-between">
          <a
            href={projeto.repo_url.startsWith("http") ? projeto.repo_url : `https://${projeto.repo_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
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
