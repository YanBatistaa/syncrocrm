import { useState, useEffect, useRef, useCallback } from "react";
import { useLeads } from "@/hooks/useLeads";
import { useProjetos } from "@/hooks/useProjetos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, RotateCcw, CheckCircle2, Circle, Calendar, Zap, Clock } from "lucide-react";
import { addDays, isBefore, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TOTAL_SECONDS = 9 * 60 * 60; // 9 hours
const MILESTONES = [3 * 3600, 6 * 3600, 9 * 3600];
const MILESTONE_LABELS = ["3 horas", "6 horas", "9 horas — Jornada completa! 🏆"];

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600).toString().padStart(2, "0");
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

interface Task {
  id: string;
  label: string;
  type: "lead" | "projeto";
  done: boolean;
}

export default function Workflow() {
  const { data: leads = [] } = useLeads();
  const { data: projetos = [] } = useProjetos();
  const { toast } = useToast();

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [triggeredMilestones, setTriggeredMilestones] = useState<Set<number>>(new Set());
  const [tasks, setTasks] = useState<Task[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build today's tasks from leads + projects
  useEffect(() => {
    const hoje = new Date();
    const em7dias = addDays(hoje, 7);
    const urgentLeads = leads
      .filter((l) => l.deadline && isBefore(parseISO(l.deadline), em7dias) && l.status !== "done")
      .map((l) => ({
        id: `lead-${l.id}`,
        label: `Lead: ${l.name} — prazo ${format(parseISO(l.deadline!), "dd/MM")}`,
        type: "lead" as const,
        done: false,
      }));
    const slowProjects = projetos
      .filter((p) => p.progress < 80 && p.status !== "done")
      .map((p) => ({
        id: `proj-${p.id}`,
        label: `Projeto: ${p.name} — ${p.progress}% concluído`,
        type: "projeto" as const,
        done: false,
      }));
    setTasks((prev) => {
      const prevById = new Map(prev.map((t) => [t.id, t]));
      return [...urgentLeads, ...slowProjects].map((t) => ({
        ...t,
        done: prevById.get(t.id)?.done ?? false,
      }));
    });
  }, [leads, projetos]);

  // Timer tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          const next = e + 1;
          // Check milestones
          MILESTONES.forEach((ms, i) => {
            if (next === ms && !triggeredMilestones.has(ms)) {
              setTriggeredMilestones((prev) => new Set([...prev, ms]));
              toast({
                title: `⏱ ${MILESTONE_LABELS[i]}`,
                description: "Marco de tempo atingido!",
              });
            }
          });
          if (next >= TOTAL_SECONDS) {
            setRunning(false);
          }
          return Math.min(next, TOTAL_SECONDS);
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, triggeredMilestones, toast]);

  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
    setTriggeredMilestones(new Set());
  };

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  }, []);

  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const remaining = TOTAL_SECONDS - elapsed;
  const progressPct = (elapsed / TOTAL_SECONDS) * 100;

  // Circle timer
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPct / 100) * circumference;

  const hoje = new Date();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Workflow Diário</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(hoje, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Timer Card */}
      <Card className="border-border/60 card-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6">
            {/* SVG Circle Timer */}
            <div className="relative">
              <svg width={200} height={200} className="-rotate-90">
                <circle
                  cx={100}
                  cy={100}
                  r={radius}
                  fill="none"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={8}
                />
                <circle
                  cx={100}
                  cy={100}
                  r={radius}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={8}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                  style={{ filter: running ? "drop-shadow(0 0 8px hsl(var(--primary) / 0.6))" : undefined }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-mono font-bold text-foreground tabular-nums">
                  {formatTime(elapsed)}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {running ? "em andamento" : elapsed > 0 ? "pausado" : "pronto"}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 border-border/60"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                className={`px-8 ${running ? "bg-secondary hover:bg-secondary/80 text-secondary-foreground" : "glow-primary"}`}
                onClick={() => setRunning((r) => !r)}
                disabled={elapsed >= TOTAL_SECONDS}
              >
                {running ? (
                  <><Pause className="w-4 h-4 mr-2" /> Pausar</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" /> {elapsed === 0 ? "Iniciar" : "Continuar"}</>
                )}
              </Button>
            </div>

            {/* Milestones */}
            <div className="flex gap-6 text-xs">
              {MILESTONES.map((ms, i) => (
                <div key={ms} className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      elapsed >= ms ? "bg-primary" : "bg-secondary"
                    }`}
                  />
                  <span className={elapsed >= ms ? "text-primary" : "text-muted-foreground"}>
                    {i + 1 === 1 ? "3h" : i + 1 === 2 ? "6h" : "9h"}
                  </span>
                </div>
              ))}
            </div>

            {/* Remaining */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(remaining)} restante</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60 card-shadow">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{done}</p>
            <p className="text-xs text-muted-foreground mt-1">Concluídas</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 card-shadow">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{total - done}</p>
            <p className="text-xs text-muted-foreground mt-1">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 card-shadow">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--status-done))]">{pct}%</p>
            <p className="text-xs text-muted-foreground mt-1">Progresso</p>
          </CardContent>
        </Card>
      </div>

      {/* Tarefas de Hoje */}
      <Card className="border-border/60 card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Tarefas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {total === 0 && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-8 h-8 text-[hsl(var(--status-done))] mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Nenhuma tarefa urgente!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Todos os leads e projetos estão em dia. 🎉
              </p>
            </div>
          )}
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className="w-full flex items-start gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 border border-border/40 hover:border-border/60 transition-all text-left group"
            >
              {task.done ? (
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--status-done))] mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-primary transition-colors" />
              )}
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm transition-all ${
                    task.done ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {task.label}
                </span>
                <span
                  className={`block text-xs mt-0.5 ${
                    task.type === "lead" ? "text-[hsl(var(--status-new))]" : "text-[hsl(var(--chart-2))]"
                  }`}
                >
                  {task.type === "lead" ? "Lead" : "Projeto"}
                </span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
