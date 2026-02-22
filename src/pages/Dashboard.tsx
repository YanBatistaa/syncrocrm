import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeads } from "@/hooks/useLeads";
import { useAllDeals } from "@/hooks/useDeals";
import { useAllGithubIssues } from "@/hooks/useGithubIssues";
import { Users, DollarSign, Briefcase, AlertCircle, Calendar, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { format, addDays, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const KANBAN_COLS = [
  { key: "new", label: "Novo", color: "hsl(var(--status-new))" },
  { key: "in-progress", label: "Em Progresso", color: "hsl(var(--status-progress))" },
  { key: "done", label: "Concluído", color: "hsl(var(--status-done))" },
] as const;

export default function Dashboard() {
  const { data: leads = [] } = useLeads();
  const { data: deals = [] } = useAllDeals();
  const { data: issues = [] } = useAllGithubIssues();

  const openDealsValue = useMemo(
    () => deals.filter((d) => d.stage !== "closed").reduce((acc, d) => acc + (d.value || 0), 0),
    [deals]
  );

  const openDealsCount = deals.filter((d) => d.stage !== "closed").length;
  const pendingIssues = issues.filter((i) => i.state === "open").length;

  // Kanban
  const kanbanCols = useMemo(
    () => KANBAN_COLS.map((col) => ({
      ...col,
      items: leads.filter((l) => l.status === col.key),
    })),
    [leads]
  );

  // Pipeline chart
  const pipelineData = KANBAN_COLS.map((col) => ({
    name: col.label,
    count: leads.filter((l) => l.status === col.key).length,
    color: col.color,
  }));

  // Deals chart
  const dealsData = [
    { name: "Prospect", count: deals.filter((d) => d.stage === "prospect").length, color: "hsl(var(--muted-foreground))" },
    { name: "Negociação", count: deals.filter((d) => d.stage === "negotiation").length, color: "hsl(var(--status-progress))" },
    { name: "Fechado", count: deals.filter((d) => d.stage === "closed").length, color: "hsl(var(--status-done))" },
  ];

  // Tarefas urgentes (leads com prazo nos próximos 7 dias)
  const hoje = new Date();
  const em7dias = addDays(hoje, 7);
  const urgentLeads = leads.filter(
    (l) => l.deadline && isBefore(parseISO(l.deadline), em7dias) && l.status !== "done"
  );

  const kpis = [
    { label: "Total Leads", value: leads.length, icon: Users, color: "text-primary" },
    {
      label: "Pipeline Aberto",
      value: `R$ ${openDealsValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-[hsl(var(--status-done))]",
    },
    { label: "Deals Ativos", value: openDealsCount, icon: Briefcase, color: "text-[hsl(var(--status-progress))]" },
    { label: "Issues Pendentes", value: pendingIssues, icon: AlertCircle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(hoje, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="card-shadow border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban + Tarefas */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pipeline de Leads</h2>
          <div className="grid grid-cols-3 gap-3">
            {kanbanCols.map((col) => (
              <div key={col.key} className="rounded-lg border border-border/60 bg-card/50 p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: col.color }}>
                    {col.label}
                  </span>
                  <span
                    className="text-xs rounded-full px-1.5 py-0.5 font-medium"
                    style={{ color: col.color, background: `${col.color}20` }}
                  >
                    {col.items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {col.items.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-md bg-card border border-border/60 p-2.5 hover:border-border transition-colors"
                    >
                      <p className="text-xs font-medium text-foreground truncate">{lead.name}</p>
                      {lead.company && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.company}</p>
                      )}
                      {lead.deadline && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(lead.deadline), "dd/MM")}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {col.items.length === 0 && (
                    <p className="text-xs text-muted-foreground/40 text-center py-4">Vazio</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tarefas Hoje</h2>
          <Card className="border-border/60 card-shadow">
            <CardContent className="p-4 space-y-4">
              {urgentLeads.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Tudo em dia! 🎉</p>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-[hsl(var(--status-progress))] uppercase tracking-wider mb-2">
                    Leads com prazo próximo
                  </p>
                  <div className="space-y-1.5">
                    {urgentLeads.slice(0, 5).map((l) => (
                      <div key={l.id} className="flex items-center justify-between text-xs">
                        <span className="text-foreground truncate">{l.name}</span>
                        <span className="text-muted-foreground ml-2 flex-shrink-0">
                          {format(parseISO(l.deadline!), "dd/MM")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/60 card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Pipeline por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={pipelineData} barSize={36}>
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  cursor={{ fill: "hsl(var(--border) / 0.3)" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {pipelineData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60 card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Deals por Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dealsData} barSize={36}>
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  cursor={{ fill: "hsl(var(--border) / 0.3)" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {dealsData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
