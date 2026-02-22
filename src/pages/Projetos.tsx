import { useAllDealsWithLead, useDeleteDeal, DealWithLead } from "@/hooks/useDeals";
import { Briefcase, DollarSign, Trash2 } from "lucide-react";

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

export default function Projetos() {
  const { data: dealsWithLead = [], isLoading } = useAllDealsWithLead();
  const deleteDeal = useDeleteDeal();

  // Agrupa deals por lead
  const dealsByLead = dealsWithLead.reduce<Record<number, DealWithLead[]>>((acc, deal) => {
    if (!acc[deal.lead_id]) acc[deal.lead_id] = [];
    acc[deal.lead_id].push(deal);
    return acc;
  }, {});

  const totalClientes = Object.keys(dealsByLead).length;
  const totalDeals = dealsWithLead.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Projetos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {totalClientes} clientes · {totalDeals} deals
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Carregando...</div>
      ) : totalClientes === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <Briefcase className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Nenhum deal cadastrado ainda.</p>
          <p className="text-muted-foreground/60 text-xs">Adicione deals nos seus Leads para eles aparecerem aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(dealsByLead).map(([, deals]) => {
            const leadName = deals[0].lead_name;
            const leadCompany = deals[0].lead_company;
            const totalValue = deals.reduce((a, d) => a + (d.value || 0), 0);
            const openDeals = deals.filter((d) => d.stage !== "closed").length;

            return (
              <div
                key={deals[0].lead_id}
                className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-3"
              >
                {/* Lead header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{leadName}</p>
                      {leadCompany && (
                        <p className="text-xs text-muted-foreground truncate">{leadCompany}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {openDeals > 0 && (
                      <span className="text-xs text-[hsl(var(--status-progress))] bg-[hsl(var(--status-progress))/0.1] px-2 py-0.5 rounded">
                        {openDeals} aberto{openDeals > 1 ? "s" : ""}
                      </span>
                    )}
                    {totalValue > 0 && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        <DollarSign className="w-3 h-3" />
                        R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Deals do lead */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="rounded-md bg-card border border-border/60 p-3 space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-foreground truncate flex-1">
                          {deal.title}
                        </p>
                        <button
                          onClick={() => deleteDeal.mutate(deal.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-medium"
                          style={{
                            color: STAGE_COLORS[deal.stage],
                            background: `${STAGE_COLORS[deal.stage]}20`,
                          }}
                        >
                          {STAGE_LABELS[deal.stage]}
                        </span>
                        {deal.value > 0 && (
                          <span className="text-xs text-muted-foreground">
                            R$ {deal.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
