import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DealWithLead, useUpdateDeal, useDeleteDeal } from "@/hooks/useDeals";
import { useGithubIssues, useSyncGithubIssues } from "@/hooks/useGithubIssues";
import { useDealNotes, useCreateDealNote } from "@/hooks/useDealNotes";
import { toast } from "@/hooks/use-toast";
import {
  Briefcase,
  DollarSign,
  Github,
  RefreshCw,
  ExternalLink,
  Trash2,
  Save,
  Loader2,
  Send,
  Clock,
  Circle,
  CheckCircle2,
  Link as LinkIcon,
} from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const STAGE_CONFIG = {
  prospect: { label: "Prospect", color: "hsl(var(--muted-foreground))" },
  negotiation: { label: "Negociação", color: "hsl(var(--status-progress))" },
  closed: { label: "Fechado", color: "hsl(var(--status-done))" },
} as const;

interface Props {
  deal: DealWithLead | null;
  onClose: () => void;
}

export default function DealPageModal({ deal, onClose }: Props) {
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();
  const syncIssues = useSyncGithubIssues();
  const createNote = useCreateDealNote();

  const { data: issues = [] } = useGithubIssues(undefined, undefined, deal?.id);
  const { data: notes = [] } = useDealNotes(deal?.id);

  const [form, setForm] = useState({
    title: "",
    value: "",
    stage: "prospect" as keyof typeof STAGE_CONFIG,
    repo_url: "",
  });
  const [noteInput, setNoteInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (deal) {
      setForm({
        title: deal.title ?? "",
        value: String(deal.value ?? ""),
        stage: deal.stage as keyof typeof STAGE_CONFIG,
        repo_url: deal.repo_url ?? "",
      });
      setNoteInput("");
      setConfirmDelete(false);
    }
  }, [deal?.id]);

  if (!deal) return null;

  const set = (key: keyof typeof form, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    updateDeal.mutate(
      {
        id: deal.id,
        title: form.title,
        value: parseFloat(form.value) || 0,
        stage: form.stage,
        repo_url: form.repo_url || null,
      },
      { onSuccess: () => toast({ title: "Deal atualizado!" }) }
    );
  };

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    deleteDeal.mutate(deal.id, { onSuccess: onClose });
  };

  const handleSync = () => {
    if (!form.repo_url) return;
    syncIssues.mutate({ repoUrl: form.repo_url, dealId: deal.id });
  };

  const handleAddNote = () => {
    const content = noteInput.trim();
    if (!content) return;
    createNote.mutate(
      { deal_id: deal.id, content },
      { onSuccess: () => setNoteInput("") }
    );
  };

  const openIssues = issues.filter((i) => i.state === "open");
  const closedIssues = issues.filter((i) => i.state === "closed");
  const stageConf = STAGE_CONFIG[form.stage];

  return (
    <Dialog open={!!deal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col bg-card border-border/60 overflow-hidden gap-0">

        {/* ─── Cabeçalho fixo ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-foreground truncate">
                {deal.title}
              </DialogTitle>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-primary/80">{deal.lead_name}</span>
                {deal.lead_company && (
                  <span className="text-xs text-muted-foreground">· {deal.lead_company}</span>
                )}
                <span className="text-muted-foreground/40">·</span>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(deal.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ color: stageConf.color, background: `${stageConf.color}20` }}
            >
              {stageConf.label}
            </span>
            {deal.value > 0 && (
              <div className="flex items-center gap-1 text-sm font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                <DollarSign className="w-3.5 h-3.5" />
                R$ {deal.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        </div>

        {/* ─── Conteúdo em 2 colunas com scroll ─────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex">

          {/* Coluna esquerda: Informações + Issues */}
          <div className="w-[55%] flex-shrink-0 border-r border-border/40 overflow-y-auto p-6 space-y-7">

            {/* Informações */}
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Informações
              </h2>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Título</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    className="bg-background border-border/60 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        value={form.value}
                        onChange={(e) => set("value", e.target.value)}
                        className="bg-background border-border/60 text-sm pl-7"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Stage</Label>
                    <Select value={form.stage} onValueChange={(v) => set("stage", v)}>
                      <SelectTrigger className="bg-background border-border/60 text-sm">
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
                  <Label className="text-xs text-muted-foreground">Repo URL</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        value={form.repo_url}
                        onChange={(e) => set("repo_url", e.target.value)}
                        className="bg-background border-border/60 text-sm pl-7"
                        placeholder="github.com/user/repo"
                      />
                    </div>
                    {form.repo_url && (
                      <a
                        href={form.repo_url.startsWith("http") ? form.repo_url : `https://${form.repo_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 rounded-md border border-border/60 text-xs text-muted-foreground hover:text-primary transition-colors bg-background"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateDeal.isPending}
                  className="w-full"
                >
                  {updateDeal.isPending ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Salvando...</>
                  ) : (
                    <><Save className="w-3.5 h-3.5 mr-1.5" /> Salvar alterações</>
                  )}
                </Button>
              </div>
            </section>

            <Separator className="bg-border/40" />

            {/* GitHub Issues */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Github className="w-3.5 h-3.5" />
                  GitHub Issues
                  {issues.length > 0 && (
                    <span className="bg-muted/40 px-1.5 py-0.5 rounded text-muted-foreground">
                      {openIssues.length} abertas
                    </span>
                  )}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-border/60"
                  onClick={handleSync}
                  disabled={syncIssues.isPending || !form.repo_url}
                  title={!form.repo_url ? "Adicione um Repo URL" : ""}
                >
                  {syncIssues.isPending ? (
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  Sync
                </Button>
              </div>

              {!form.repo_url && (
                <p className="text-xs text-muted-foreground/50">
                  Adicione um Repo URL acima para sincronizar issues.
                </p>
              )}

              {issues.length === 0 && form.repo_url && (
                <p className="text-xs text-muted-foreground/50 text-center py-4">
                  Nenhuma issue. Clique em Sync.
                </p>
              )}

              {/* Abertas */}
              {openIssues.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Abertas</p>
                  {openIssues.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} />
                  ))}
                </div>
              )}

              {/* Fechadas */}
              {closedIssues.length > 0 && (
                <div className="space-y-1.5 mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Fechadas</p>
                  {closedIssues.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Coluna direita: Timeline de Notas */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header da coluna */}
            <div className="px-6 py-4 border-b border-border/40 flex-shrink-0">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Timeline de Notas
                <span className="bg-muted/40 px-1.5 py-0.5 rounded text-muted-foreground">{notes.length}</span>
              </h2>
            </div>

            {/* Feed de notas com scroll */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-0">
              {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                  <Clock className="w-8 h-8 text-muted-foreground/20" />
                  <p className="text-xs text-muted-foreground/50">
                    Nenhuma nota ainda.<br />Adicione a primeira abaixo.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Linha vertical da timeline */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border/60" />

                  <div className="space-y-5">
                    {notes.map((note, idx) => (
                      <div key={note.id} className="flex gap-4 relative">
                        {/* Dot */}
                        <div className="flex-shrink-0 mt-1">
                          {idx === 0 ? (
                            <Circle className="w-3.5 h-3.5 text-primary fill-primary" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-border fill-card" />
                          )}
                        </div>
                        {/* Conteúdo */}
                        <div className="flex-1 pb-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground">
                              {format(parseISO(note.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(note.created_at), "HH:mm", { locale: ptBR })}
                            </span>
                            <span className="text-xs text-muted-foreground/50">
                              · {formatDistanceToNow(parseISO(note.created_at), { locale: ptBR, addSuffix: true })}
                            </span>
                          </div>
                          <div className="rounded-lg bg-background border border-border/60 p-3">
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                              {note.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input fixo no fundo */}
            <div className="px-6 py-4 border-t border-border/40 flex-shrink-0 space-y-2">
              <Textarea
                ref={noteRef}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote();
                }}
                className="bg-background border-border/60 text-sm resize-none min-h-[80px]"
                placeholder="Adicione uma nota... (Ctrl+Enter para salvar)"
              />
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={createNote.isPending || !noteInput.trim()}
                className="w-full"
              >
                {createNote.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                )}
                Salvar nota
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Footer fixo ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-3 border-t border-border/40 flex justify-between items-center flex-shrink-0 bg-card">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleteDeal.isPending}
            className={confirmDelete
              ? "text-white bg-destructive hover:bg-destructive/90"
              : "text-destructive hover:bg-destructive/10 hover:text-destructive"
            }
          >
            {deleteDeal.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            )}
            {confirmDelete ? "Clique novamente para confirmar" : "Excluir deal"}
          </Button>
          <span className="text-xs text-muted-foreground/40">Deal #{ deal.id}</span>
        </div>

      </DialogContent>
    </Dialog>
  );
}

// ─── Issue Row ────────────────────────────────────────────────────────────────
function IssueRow({
  issue,
}: {
  issue: { id: number; gh_id: number; title: string; state: string; url: string | null };
}) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-background border border-border/60 group">
      <div className="flex items-center gap-2 min-w-0">
        {issue.state === "open" ? (
          <Circle className="w-3 h-3 text-[hsl(var(--status-done))] fill-[hsl(var(--status-done))] flex-shrink-0" />
        ) : (
          <CheckCircle2 className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
        )}
        <p className="text-xs text-foreground truncate">
          <span className="text-muted-foreground mr-1">#{issue.gh_id}</span>
          {issue.title}
        </p>
      </div>
      {issue.url && (
        <a
          href={issue.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
