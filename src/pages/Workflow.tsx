import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useDailyTasks,
  useCreateDailyTask,
  useUpdateDailyTask,
  useDeleteDailyTask,
  DailyTask,
} from "@/hooks/useDailyTasks";
import {
  useAutomations,
  useCreateAutomation,
  useUpdateAutomation,
  useDeleteAutomation,
  Automation,
  AutomationInsert,
  TRIGGER_LABELS,
  TRIGGER_DESCRIPTIONS,
  DEFAULT_TEMPLATES,
} from "@/hooks/useAutomations";
import { useLeads } from "@/hooks/useLeads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Card } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Zap,
  CheckSquare,
  Square,
  AlertCircle,
  Calendar,
  Inbox,
  Edit2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
} from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

const PRIORITY_CONFIG = {
  urgent: {
    label: "Urgente",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  scheduled: {
    label: "Agendado",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/30",
    icon: <Calendar className="w-3.5 h-3.5" />,
  },
  backlog: {
    label: "Backlog",
    color: "text-muted-foreground",
    bg: "bg-muted/20",
    border: "border-border/40",
    icon: <Inbox className="w-3.5 h-3.5" />,
  },
};

const EMPTY_TASK = {
  title: "",
  notes: "",
  priority: "scheduled" as DailyTask["priority"],
  scheduled_date: new Date().toISOString().split("T")[0],
};

const EMPTY_AUTOMATION: AutomationInsert = {
  name: "",
  trigger_type: "deadline_approaching",
  trigger_value: {},
  webhook_url: "",
  message_template: DEFAULT_TEMPLATES["deadline_approaching"],
  active: true,
};

export default function Workflow() {
  const today = new Date().toISOString().split("T")[0];
  const { data: tasks = [], isLoading: tasksLoading } = useDailyTasks(today);
  const { data: automations = [], isLoading: autoLoading } = useAutomations();
  const { data: leads = [] } = useLeads();

  const createTask = useCreateDailyTask();
  const updateTask = useUpdateDailyTask();
  const deleteTask = useDeleteDailyTask();
  const createAutomation = useCreateAutomation();
  const updateAutomation = useUpdateAutomation();
  const deleteAutomation = useDeleteAutomation();

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [editingAuto, setEditingAuto] = useState<Automation | null>(null);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);
  const [autoForm, setAutoForm] = useState<AutomationInsert>(EMPTY_AUTOMATION);
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});

  // Auto-gera tarefas urgentes a partir de leads com prazo amanhã
  const urgentFromLeads = useMemo(() => {
    return leads
      .filter((l) => {
        if (!l.deadline || l.status === "done") return false;
        const days = differenceInDays(parseISO(l.deadline), new Date());
        return days <= 1 && days >= 0;
      })
      .map((l) => ({
        id: `lead-${l.id}`,
        title: `Prazo: ${l.name}${l.company ? ` — ${l.company}` : ""}`,
        notes: `Deadline: ${format(parseISO(l.deadline!), "dd/MM/yyyy")}`,
        priority: "urgent" as const,
        source: "lead" as const,
        isVirtual: true as const,  // ← adiciona "as const" aqui
      }));
  }, [leads]);

  const tasksByPriority = useMemo(() => {
    const manual = {
      urgent: tasks.filter((t) => t.priority === "urgent"),
      scheduled: tasks.filter((t) => t.priority === "scheduled"),
      backlog: tasks.filter((t) => t.priority === "backlog"),
    };
    return manual;
  }, [tasks]);

  const doneTodayCount = tasks.filter((t) => t.done).length;
  const totalTodayCount = tasks.length + urgentFromLeads.length;

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm(EMPTY_TASK);
    setShowTaskModal(true);
  };

  const openEditTask = (task: DailyTask) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      notes: task.notes ?? "",
      priority: task.priority,
      scheduled_date: task.scheduled_date,
    });
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async () => {
    if (!taskForm.title.trim()) return;
    if (editingTask) {
      await updateTask.mutateAsync({ id: editingTask.id, ...taskForm });
    } else {
      await createTask.mutateAsync({
        ...taskForm,
        done: false,
        source: "manual",
        source_id: null,
      });
    }
    setShowTaskModal(false);
    setTaskForm(EMPTY_TASK);
  };

  const handleToggleDone = (task: DailyTask) => {
    updateTask.mutate({ id: task.id, done: !task.done });
  };

  const openCreateAuto = () => {
    setEditingAuto(null);
    setAutoForm(EMPTY_AUTOMATION);
    setShowAutoModal(true);
  };

  const openEditAuto = (auto: Automation) => {
    setEditingAuto(auto);
    setAutoForm({
      name: auto.name,
      trigger_type: auto.trigger_type,
      trigger_value: auto.trigger_value,
      webhook_url: auto.webhook_url,
      message_template: auto.message_template,
      active: auto.active,
    });
    setShowAutoModal(true);
  };

  const handleAutoSubmit = async () => {
    if (!autoForm.name.trim() || !autoForm.webhook_url.trim()) return;
    if (editingAuto) {
      await updateAutomation.mutateAsync({ id: editingAuto.id, ...autoForm });
    } else {
      await createAutomation.mutateAsync(autoForm);
    }
    setShowAutoModal(false);
    setAutoForm(EMPTY_AUTOMATION);
  };

  const handleToggleActive = (auto: Automation) => {
    updateAutomation.mutate({ id: auto.id, active: !auto.active });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workflow</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border/60 px-3 py-1.5 rounded-lg text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {doneTodayCount}/{totalTodayCount} tarefas concluídas
        </div>
      </div>

      {/* Daily Board */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" />
            Daily Board
          </h2>
          <Button size="sm" variant="outline" className="h-7 text-xs border-border/60" onClick={openCreateTask}>
            <Plus className="w-3 h-3 mr-1" />
            Nova Tarefa
          </Button>
        </div>

        {/* Urgentes de leads */}
        {urgentFromLeads.length > 0 && (
          <TaskSection
            priority="urgent"
            items={[]}
            virtualItems={urgentFromLeads}
            onToggle={() => { }}
            onEdit={() => { }}
            onDelete={() => { }}
            expanded={expandedTasks}
            onToggleExpand={(id) =>
              setExpandedTasks((p) => ({ ...p, [id]: !p[id] }))
            }
          />
        )}

        {/* Urgentes manuais */}
        {(tasksByPriority.urgent.length > 0 || urgentFromLeads.length === 0) && (
          <TaskSection
            priority="urgent"
            items={tasksByPriority.urgent}
            virtualItems={urgentFromLeads.length > 0 ? [] : []}
            onToggle={handleToggleDone}
            onEdit={openEditTask}
            onDelete={(id) => deleteTask.mutate(id)}
            expanded={expandedTasks}
            onToggleExpand={(id) =>
              setExpandedTasks((p) => ({ ...p, [id]: !p[id] }))
            }
            hideIfEmpty={urgentFromLeads.length > 0}
          />
        )}

        <TaskSection
          priority="scheduled"
          items={tasksByPriority.scheduled}
          virtualItems={[]}
          onToggle={handleToggleDone}
          onEdit={openEditTask}
          onDelete={(id) => deleteTask.mutate(id)}
          expanded={expandedTasks}
          onToggleExpand={(id) =>
            setExpandedTasks((p) => ({ ...p, [id]: !p[id] }))
          }
        />

        <TaskSection
          priority="backlog"
          items={tasksByPriority.backlog}
          virtualItems={[]}
          onToggle={handleToggleDone}
          onEdit={openEditTask}
          onDelete={(id) => deleteTask.mutate(id)}
          expanded={expandedTasks}
          onToggleExpand={(id) =>
            setExpandedTasks((p) => ({ ...p, [id]: !p[id] }))
          }
        />

        {tasksLoading && (
          <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>
        )}
      </div>

      {/* Automações */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Automações Discord
          </h2>
          <Button size="sm" variant="outline" className="h-7 text-xs border-border/60" onClick={openCreateAuto}>
            <Plus className="w-3 h-3 mr-1" />
            Nova Automação
          </Button>
        </div>

        {autoLoading ? (
          <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>
        ) : automations.length === 0 ? (
          <Card className="border-border/60 border-dashed">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Zap className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma automação configurada</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Crie alertas automáticos para o seu Discord
              </p>
              <Button size="sm" className="mt-4" onClick={openCreateAuto}>
                <Plus className="w-3 h-3 mr-1" />
                Criar primeira automação
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {automations.map((auto) => (
              <AutomationCard
                key={auto.id}
                automation={auto}
                onToggle={() => handleToggleActive(auto)}
                onEdit={() => openEditAuto(auto)}
                onDelete={() => deleteAutomation.mutate(auto.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="bg-card border-border/60 max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Atualize os detalhes da tarefa" : "Adicione uma tarefa ao seu dia"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Título *</Label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                className="bg-background border-border/60 text-sm"
                placeholder="O que precisa ser feito?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Prioridade</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(v) =>
                    setTaskForm((f) => ({ ...f, priority: v as DailyTask["priority"] }))
                  }
                >
                  <SelectTrigger className="bg-background border-border/60 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">🔴 Urgente</SelectItem>
                    <SelectItem value="scheduled">🟡 Agendado</SelectItem>
                    <SelectItem value="backlog">⚪ Backlog</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data</Label>
                <Input
                  type="date"
                  value={taskForm.scheduled_date}
                  onChange={(e) =>
                    setTaskForm((f) => ({ ...f, scheduled_date: e.target.value }))
                  }
                  className="bg-background border-border/60 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Notas</Label>
              <Textarea
                value={taskForm.notes}
                onChange={(e) => setTaskForm((f) => ({ ...f, notes: e.target.value }))}
                className="bg-background border-border/60 text-sm resize-none"
                rows={3}
                placeholder="Detalhes, contexto, próximos passos..."
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" size="sm" onClick={() => setShowTaskModal(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleTaskSubmit}
              disabled={createTask.isPending || updateTask.isPending}
            >
              {editingTask ? "Salvar" : "Criar Tarefa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Automation Modal */}
      <Dialog open={showAutoModal} onOpenChange={setShowAutoModal}>
        <DialogContent className="bg-card border-border/60 max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAuto ? "Editar Automação" : "Nova Automação"}
            </DialogTitle>
            <DialogDescription>
              Configure um alerta automático para o seu Discord
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome *</Label>
              <Input
                value={autoForm.name}
                onChange={(e) => setAutoForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-background border-border/60 text-sm"
                placeholder="Ex: Alerta de prazo"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Gatilho</Label>
              <Select
                value={autoForm.trigger_type}
                onValueChange={(v) => {
                  const type = v as Automation["trigger_type"];
                  setAutoForm((f) => ({
                    ...f,
                    trigger_type: type,
                    message_template: DEFAULT_TEMPLATES[type],
                  }));
                }}
              >
                <SelectTrigger className="bg-background border-border/60 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground/60">
                {TRIGGER_DESCRIPTIONS[autoForm.trigger_type]}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                Webhook URL Discord
                <a
                  href="https://support.discord.com/hc/pt-br/articles/228383668"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  Como criar?
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </Label>
              <Input
                value={autoForm.webhook_url}
                onChange={(e) => setAutoForm((f) => ({ ...f, webhook_url: e.target.value }))}
                className="bg-background border-border/60 text-sm"
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Mensagem
                <span className="ml-2 font-normal text-muted-foreground/60">
                  (use {`{{lead.name}}`}, {`{{lead.deadline}}`}, etc.)
                </span>
              </Label>
              <Textarea
                value={autoForm.message_template}
                onChange={(e) =>
                  setAutoForm((f) => ({ ...f, message_template: e.target.value }))
                }
                className="bg-background border-border/60 text-sm resize-none font-mono"
                rows={5}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={autoForm.active}
                onCheckedChange={(v) => setAutoForm((f) => ({ ...f, active: v }))}
              />
              <Label className="text-xs text-muted-foreground">Ativa</Label>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" size="sm" onClick={() => setShowAutoModal(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleAutoSubmit}
              disabled={createAutomation.isPending || updateAutomation.isPending}
            >
              {editingAuto ? "Salvar" : "Criar Automação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Task Section ─────────────────────────────────────────────────────────────
function TaskSection({
  priority,
  items,
  virtualItems,
  onToggle,
  onEdit,
  onDelete,
  expanded,
  onToggleExpand,
  hideIfEmpty = false,
}: {
  priority: DailyTask["priority"];
  items: DailyTask[];
  virtualItems: { id: string; title: string; notes: string; priority: "urgent"; source: "lead"; isVirtual: true }[];
  onToggle: (task: DailyTask) => void;
  onEdit: (task: DailyTask) => void;
  onDelete: (id: number) => void;
  expanded: Record<number, boolean>;
  onToggleExpand: (id: number) => void;
  hideIfEmpty?: boolean;
}) {
  const config = PRIORITY_CONFIG[priority];
  const allItems = [...virtualItems, ...items];

  if (hideIfEmpty && allItems.length === 0) return null;

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${config.border} ${config.bg}`}>
      <div className={`flex items-center gap-2 text-xs font-semibold ${config.color}`}>
        {config.icon}
        {config.label}
        <span className="bg-background/40 px-1.5 py-0.5 rounded">{allItems.length}</span>
      </div>

      {allItems.length === 0 && (
        <p className="text-xs text-muted-foreground/40 text-center py-2">Nenhuma tarefa</p>
      )}

      {virtualItems.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-2 p-2 rounded-md bg-background/60 border border-border/40"
        >
          <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">{item.title}</p>
            {item.notes && (
              <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground/50 bg-muted/30 px-1.5 py-0.5 rounded shrink-0">
            auto
          </span>
        </div>
      ))}

      {items.map((task) => (
        <div
          key={task.id}
          className={`flex items-start gap-2 p-2 rounded-md bg-background/60 border border-border/40 transition-opacity ${task.done ? "opacity-50" : ""
            }`}
        >
          <button
            onClick={() => onToggle(task)}
            className={`mt-0.5 flex-shrink-0 ${config.color}`}
          >
            {task.done ? (
              <CheckSquare className="w-3.5 h-3.5" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {task.title}
            </p>
            {task.notes && (
              <button
                onClick={() => onToggleExpand(task.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground/60 mt-0.5 hover:text-muted-foreground"
              >
                {expanded[task.id] ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                notas
              </button>
            )}
            {expanded[task.id] && task.notes && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{task.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(task)}
              className="p-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Automation Card ──────────────────────────────────────────────────────────
function AutomationCard({
  automation,
  onToggle,
  onEdit,
  onDelete,
}: {
  automation: Automation;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const triggerIcons: Record<Automation["trigger_type"], string> = {
    deadline_approaching: "🔴",
    no_progress: "⚠️",
    new_lead: "🟢",
    end_of_day: "📋",
  };

  return (
    <Card className={`border-border/60 p-3 space-y-2.5 ${!automation.active ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{triggerIcons[automation.trigger_type]}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{automation.name}</p>
            <p className="text-xs text-muted-foreground">
              {TRIGGER_LABELS[automation.trigger_type]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Switch checked={automation.active} onCheckedChange={onToggle} />
        </div>
      </div>

      <div className="bg-background/60 border border-border/40 rounded p-2">
        <p className="text-xs text-muted-foreground/70 font-mono line-clamp-2">
          {automation.message_template}
        </p>
      </div>

      <div className="flex items-center justify-between">
        {automation.last_fired_at ? (
          <p className="text-xs text-muted-foreground/50">
            Último disparo:{" "}
            {format(new Date(automation.last_fired_at), "dd/MM HH:mm")}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/50">Nunca disparou</p>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </Card>
  );
}
