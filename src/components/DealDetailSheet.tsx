import { useEffect, useState } from "react";
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
import { DealWithLead, useUpdateDeal, useDeleteDeal } from "@/hooks/useDeals";
import { useGithubIssues, useSyncGithubIssues } from "@/hooks/useGithubIssues";
import {
  Briefcase,
  DollarSign,
  Github,
  RefreshCw,
  ExternalLink,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

const STAGE_LABELS: Record<string, string> = {
  prospect: "Prospect",
  negotiation: "Negociação",
  closed: "Fechado",
};

interface Props {
  deal: DealWithLead | null;
  onClose: () => void;
}

export default function DealDetailSheet({ deal, onClose }: Props) {
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();
  const syncIssues = useSyncGithubIssues();

  const { data: issues = [] } = useGithubIssues(deal?.lead_id ?? undefined);

  const [form, setForm] = useState({
    title: "",
    value: "",
    stage: "prospect" as Deal["stage"],
    notes: "",
    repo_url: "",
  });

  type Deal = DealWithLead;

  // Popula form quando o deal muda
  useEffect(() => {
    if (deal) {
      setForm({
        title: deal.title ?? "",
        value: String(deal.value ?? ""),
        stage: deal.stage,
        notes: deal.notes ?? "",
        repo_url: deal.repo_url ?? "",
      });
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
        stage: form.stage as DealWithLead["stage"],
        notes: form.notes || null,
        repo_url: form.repo_url || null,
      },
      {
        onSuccess: () => {
          toast({ title: "Deal atualizado!" });
        },
      }
    );
  };

  const handleDelete = () => {
    deleteDeal.mutate(deal.id, {
      onSuccess: () => onClose(),
    });
  };

  const handleSync = () => {
    if (!form.repo_url) return;
    syncIssues.mutate({ repoUrl: form.repo_url, leadId: deal.lead_id });
  };

  const openIssues = issues.filter((i) => i.state === "open");
  const closedIssues = issues.filter((i) => i.state === "closed");

  return (
    <Sheet open={!!deal} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-card border-l border-border/60 overflow-y-auto flex flex-col gap-0 p-0"
      >
        {/* Cabeçalho */}
        <div className="p-5 border-b border-border/40">
          <SheetHeader>
            <SheetTitle className="text-foreground text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              {deal.title}
            </SheetTitle>
            <SheetDescription className="flex items-center gap-1.5 mt-0.5">
              <span className="text-primary/80">{deal.lead_name}</span>
              {deal.lead_company && (
                <span className="text-muted-foreground">· {deal.lead_company}</span>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>Criado em {format(new Date(deal.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
            <span>·</span>
            <span
              className="px-2 py-0.5 rounded font-medium"
              style={{
                color:
                  deal.stage === "closed"
                    ? "hsl(var(--status-done))"
                    : deal.stage === "negotiation"
                    ? "hsl(var(--status-progress))"
                    : "hsl(var(--muted-foreground))",
                background:
                  deal.stage === "closed"
                    ? "hsl(var(--status-done) / 0.1)"
                    : deal.stage === "negotiation"
                    ? "hsl(var(--status-progress) / 0.1)"
                    : "hsl(var(--muted-foreground) / 0.1)",
              }}
            >
              {STAGE_LABELS[deal.stage]}
            </span>
          </div>
        </div>

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* ─── Edição ─── */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Informações</h3>

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
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Stage</Label>
                <Select
                  value={form.stage}
                  onValueChange={(v) => set("stage", v)}
                >
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
              <Label className="text-xs text-muted-foreground">Repo URL (GitHub)</Label>
              <Input
                value={form.repo_url}
                onChange={(e) => set("repo_url", e.target.value)}
                className="bg-background border-border/60 text-sm"
                placeholder="github.com/user/repo"
              />
            </div>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateDeal.isPending}
              className="w-full"
            >
              {updateDeal.isPending ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Salvando...</>
              ) : (
                <><Save className="w-3.5 h-3.5 mr-1.5" />Salvar alterações</>
              )}
            </Button>
          </section>

          {/* ─── Notas ─── */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Anotações</h3>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="bg-background border-border/60 text-sm resize-none min-h-[120px]"
              placeholder="Observações, contexto, próximos passos..."
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={updateDeal.isPending}
              className="border-border/60"
            >
              {updateDeal.isPending ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
              Salvar notas
            </Button>
          </section>

          {/* ─── GitHub Issues ─── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                GitHub Issues
                {issues.length > 0 && (
                  <span className="ml-1.5 text-xs bg-muted/40 px-1.5 py-0.5 rounded">
                    {openIssues.length} abertas
                  </span>
                )}
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-border/60"
                onClick={handleSync}
                disabled={syncIssues.isPending || !form.repo_url}
                title={!form.repo_url ? "Adicione um Repo URL acima" : undefined}
              >
                {syncIssues.isPending ? (
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Github className="w-3 h-3 mr-1" />
                )}
                Sync Issues
              </Button>
            </div>

            {!form.repo_url && (
              <p className="text-xs text-muted-foreground/50">
                Adicione um Repo URL nas informações acima para sincronizar issues.
              </p>
            )}

            {issues.length > 0 && (
              <div className="space-y-4">
                {/* Abertas */}
                {openIssues.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium">Abertas ({openIssues.length})</p>
                    {openIssues.map((issue) => (
                      <IssueRow key={issue.id} issue={issue} />
                    ))}
                  </div>
                )}
                {/* Fechadas */}
                {closedIssues.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium">Fechadas ({closedIssues.length})</p>
                    {closedIssues.map((issue) => (
                      <IssueRow key={issue.id} issue={issue} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {issues.length === 0 && form.repo_url && (
              <p className="text-xs text-muted-foreground/50 text-center py-3">
                Nenhuma issue ainda. Clique em Sync Issues.
              </p>
            )}
          </section>
        </div>

        {/* Footer fixo */}
        <div className="p-4 border-t border-border/40 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDelete}
            disabled={deleteDeal.isPending}
          >
            {deleteDeal.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            )}
            Excluir deal
          </Button>
          <p className="text-xs text-muted-foreground/50">ID #{deal.id}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Issue Row ────────────────────────────────────────────────────────────────
function IssueRow({ issue }: { issue: { id: number; gh_id: number; title: string; state: string; url: string | null } }) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-background border border-border/60">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            issue.state === "open" ? "bg-[hsl(var(--status-done))]" : "bg-muted-foreground/40"
          }`}
        />
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
          className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
