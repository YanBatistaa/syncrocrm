import { useState, useMemo } from "react";
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, Lead, LeadInsert } from "@/hooks/useLeads";
import { useCreateDeal } from "@/hooks/useDeals";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { LeadForm, EMPTY_DEAL_FORM } from "@/components/leads/LeadForm";
import { LeadTableRow } from "@/components/leads/LeadTableRow";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";

const EMPTY_LEAD: LeadInsert = {
  name: "",
  company: "",
  repo_url: "",
  status: "new",
  deadline: null,
  notes: "",
  github_sync: false,
};

export default function Leads() {
  const { data: leads = [], isLoading } = useLeads();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const createDeal = useCreateDeal();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<LeadInsert>(EMPTY_LEAD);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [initialDealForm, setInitialDealForm] = useState(EMPTY_DEAL_FORM);
  const [showDealSection, setShowDealSection] = useState(false);

  const filtered = useMemo(
    () =>
      leads.filter((l) => {
        const matchesSearch =
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          (l.company ?? "").toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || l.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [leads, search, statusFilter]
  );

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    const newLead = await createLead.mutateAsync(form);
    if (initialDealForm.title.trim() && newLead?.id) {
      await createDeal.mutateAsync({
        lead_id: newLead.id,
        title: initialDealForm.title,
        value: parseFloat(initialDealForm.value) || 0,
        stage: initialDealForm.stage,
      });
    }
    setForm(EMPTY_LEAD);
    setInitialDealForm(EMPTY_DEAL_FORM);
    setShowDealSection(false);
    setShowCreate(false);
  };

  const handleUpdate = async () => {
    if (!selectedLead) return;
    await updateLead.mutateAsync({ id: selectedLead.id, ...editForm });
    setSelectedLead(null);
  };

  const handleQuickStatusChange = async (lead: Lead, newStatus: string) => {
    await updateLead.mutateAsync({ id: lead.id, status: newStatus as "new" | "in-progress" | "done" });
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
          <p className="text-muted-foreground text-sm mt-1">
            {leads.length} leads cadastrados
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="glow-primary">
          <Plus className="w-4 h-4" />
          Novo Lead
        </Button>
      </div>

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

      <Card className="border-border/60 card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Empresa</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prazo</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">GitHub</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                    Carregando...
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                    Nenhum lead encontrado
                  </td>
                </tr>
              )}
              {filtered.map((lead) => (
                <LeadTableRow
                  key={lead.id}
                  lead={lead}
                  onClick={() => openLead(lead)}
                  onStatusChange={(v) => handleQuickStatusChange(lead, v)}
                  onDelete={() => deleteLead.mutate(lead.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border/60 max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
            <DialogDescription>Adicione um novo lead ao seu pipeline</DialogDescription>
          </DialogHeader>
          <LeadForm
            form={form}
            onChange={setForm}
            dealForm={initialDealForm}
            onDealFormChange={setInitialDealForm}
            showDealSection={showDealSection}
            onToggleDealSection={() => setShowDealSection(!showDealSection)}
          />
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
