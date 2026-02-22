import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/hooks/useLeads";
import { useAllDeals } from "@/hooks/useDeals";
import { useAllGithubIssues } from "@/hooks/useGithubIssues";
import { Users, DollarSign, Briefcase, AlertCircle, Calendar, TrendingUp, Target } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  format, addDays, isBefore, parseISO,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  startOfQuarter, endOfQuarter, isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const KANBAN_COLS = [
  { key: "new",         label: "Novo",        color: "hsl(var(--status-new))" },
  { key: "in-progress", label: "Em Progresso", color: "hsl(var(--status-progress))" },
  { key: "done",        label: "Concluído",    color: "hsl(var(--status-done))" },
] as const;

const PERIOD_OPTIONS = [
  { value: "week",    label: "Semana" },
  { value: "month",   label: "Mês" },
  { value: "quarter", label: "Trimestre" },
  { value: "all",     label: "Tudo" },
] as const;

type Period = typeof PERIOD_OPTIONS[number]["value"];

function getPeriodInterval(period: Period): { start: Date; end: Date } | null {
  const now = new Date();
  if (period === "week")    return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  if (period === "month")   return { start: startOfMonth(now), end: endOfMonth(now) };
  if (period === "quarter") return { start: startOfQuarter(now), end: endOfQuarter(now) };
  return null;
}

export default function Dashboard() {
  const { data: leads = [] }  = useLeads();
  const { data: deals = [] }  = useAllDeals();
  const { data: issues = [] } = useAllGithubIssues();

  const [period, setPeriod] = useState<Period>("month");

  const interval = getPeriodInterval(period);

  // Deals filtrados pelo período (por closed_at ou created_at)
  const filteredDeals = useMemo(() => {
    if (!interval) return deals;
    return deals.filter((d) => {
      const date = d.closed_at ?? d.created_at;
      return date && isWithinInterval(parseISO(date), interval);
    });
  }, [deals, interval]);

  const closedInPeriod = filteredDeals.filter((d) => d.stage === "closed");
  const closedValue    = closedInPeriod.reduce((a, d) => a + (d.value || 0), 0);
  const lostInPeriod   = filteredDeals.filter((d) => d.stage === "lost");

  const openDealsValue = useMemo(
    () => deals.filter((d) => d.stage !== "closed" && d.stage !== "lost").reduce((a, d) => a + (d.value || 0), 0),
    [deals]
  );
  const openDealsCount = deals.filter((d) => d.stage !== "closed" && d.stage !== "lost").length;
  const pendingIssues  = issues.filter((i) => i.state === "open").length;

  // Taxa de conversão do período
  const totalResolved = closedInPeriod.length + lostInPeriod.length;
  const conversionRate = totalResolved > 0
    ? Math.round((closedInPeriod.length / totalResolved) * 100)
    : null;

  const kanbanCols = useMemo(
    () => KANBAN_COLS.map((col) => ({
      ...col,
      items: leads.filter((l) => l.status === col.key),
    })),
    [leads]
  );

  const pipelineData = KANBAN_COLS.map((col) => ({
    name: col.label,
    count: leads.filter((l) => l.status === col.key).length,
    color: col.color,
  }));

  const dealsData = [
    { name: "Prospect",   count: deals.filter((d) => d.stage === "prospect").length,   color: "hsl(var(--muted-foreground))" },
    { name: "Negociação", count: deals.filter((d) => d.stage === "negotiation").length, color: "hsl(var(--status-progress))" },
    { name: "Fechado",    count: deals.filter((d) => d.stage === "closed").length,      color: "hsl(var(--status-done))" },
    { name: "Perdido",    count: deals.filter((d) => d.stage === "lost").length,        color: "hsl(var(--destructive))" },
  ];

  const hoje = new Date();
  const em7dias = addDays(hoje, 7);
  const urgentLeads = leads.filter(
    (l) => l.deadline && isBefore(parseISO(l.deadline), em7dias) && l.status !== "done"
  );

  const kpis = [
    { label: "Total Leads",    value: leads.length,    icon: Users,       color: "text-primary" },
    { label: "Pipeline Aberto", value: `R$ ${openDealsValue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, icon: DollarSign, color: "text-[hsl(var(--status-done))]" },
    { label: "Deals Ativos",   value: openDealsCount,  icon: Briefcase,   color: "text-[hsl(var(--status-progress))]" },
    { label: "Issues Abertas", value: pendingIssues,   icon: AlertCircle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(hoje, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        {/* Seletor de período */}
        <div className="flex items-center gap-1 bg-card border border-border/60 rounded-lg p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={period === opt.value ? "default" : "ghost"}
              className={`h-7 text-xs px-3 ${
                period === opt.value ? "" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPIs fixos */}
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

      {/* KPIs do período */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="card-shadow border-border/60 bg-[hsl(var(--status-done)/0.07)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Receita fechada</span>
              <DollarSign className="w-4 h-4 text-[hsl(var(--status-done))]" />
            </div>
            <div className="text-2xl font-bold text-[hsl(var(--status-done))]">
              R$ {closedValue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {closedInPeriod.length} deal{closedInPeriod.length !== 1 ? "s" : ""} · {PERIOD_OPTIONS.find((o) => o.value === period)?.label}
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Deals perdidos</span>
              <Briefcase className="w-4 h-4 text-destructive" />
            </div>
            <div className="text-2xl font-bold text-destructive">{lostInPeriod.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {PERIOD_OPTIONS.find((o) => o.value === period)?.label}
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Taxa de conversão</span>
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {conversionRate !== null ? `${conversionRate}%` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Fechados ÷ (Fechados + Perdidos)</p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban + Tarefas */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pipeline de Leads</h2>
          <div className="grid grid-cols-3 gap-3">
            {kanbanCols.map((col) => (
              <div key={col.key} className="rounded-lg border border-border/60 bg-card/50 p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: col.color }}>{col.label}</span>
                  <span className="text-xs rounded-full px-1.5 py-0.5 font-medium" style={{ color: col.color, background: `${col.color}20` }}>
                    {col.items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {col.items.map((lead) => (
                    <div key={lead.id} className="rounded-md bg-card border border-border/60 p-2.5">
                      <p className="text-xs font-medium text-foreground truncate">{lead.name}</p>
                      {lead.company && <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.company}</p>}
                      {/* Tags no mini card */}
                      {(lead.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(lead.tags ?? []).slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0 rounded-full">{tag}</span>
                          ))}
                        </div>
                      )}
                      {lead.deadline && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{format(parseISO(lead.deadline), "dd/MM")}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {col.items.length === 0 && <p className="text-xs text-muted-foreground/40 text-center py-4">Vazio</p>}
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
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "hsl(var(--foreground))" }} cursor={{ fill: "hsl(var(--border) / 0.3)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {pipelineData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "hsl(var(--foreground))" }} cursor={{ fill: "hsl(var(--border) / 0.3)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {dealsData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
