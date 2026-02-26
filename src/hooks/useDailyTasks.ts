import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface DailyTask {
    id: number;
    title: string;
    notes: string | null;
    done: boolean;
    priority: "urgent" | "scheduled" | "backlog";
    source: "manual" | "lead" | "projeto";
    source_id: number | null;
    scheduled_date: string;
    created_at: string;
    recurrence: "none" | "daily" | "weekly" | "monthly";
    recurrence_active: boolean;
}

export type DailyTaskInsert = Omit<DailyTask, "id" | "created_at">;
export type DailyTaskUpdate = Partial<DailyTaskInsert>;

// ── tarefas do dia ────────────────────────────────────────────────────────────
export function useDailyTasks(date?: string) {
    const today = date ?? new Date().toISOString().split("T")[0];
    return useQuery({
        queryKey: ["daily_tasks", today],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("daily_tasks")
                .select("*")
                .eq("scheduled_date", today)
                .order("priority", { ascending: true })
                .order("created_at", { ascending: true });
            if (error) throw error;
            return data as DailyTask[];
        },
    });
}

// ── tarefas atrasadas (não concluídas antes de hoje) ──────────────────────────
export function useOverdueTasks() {
    const today = new Date().toISOString().split("T")[0];
    return useQuery({
        queryKey: ["daily_tasks_overdue"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("daily_tasks")
                .select("*")
                .lt("scheduled_date", today)
                .eq("done", false)
                .not("recurrence", "eq", "daily") // recorrentes diárias não são "atrasadas"
                .order("scheduled_date", { ascending: true });
            if (error) throw error;
            return data as DailyTask[];
        },
    });
}

// ── todas as tarefas recorrentes (painel) ─────────────────────────────────────
export function useRecurringTasks() {
    return useQuery({
        queryKey: ["recurring_tasks"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("daily_tasks")
                .select("*")
                .neq("recurrence", "none")
                // pega apenas a mais recente de cada título (proxy de "template")
                .order("created_at", { ascending: false });
            if (error) throw error;
            // deduplica por title+recurrence mantendo a mais recente
            const seen = new Set<string>();
            return (data as DailyTask[]).filter((t) => {
                const key = `${t.title}__${t.recurrence}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        },
    });
}

// ── criar ─────────────────────────────────────────────────────────────────────
export function useCreateDailyTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (task: DailyTaskInsert) => {
            const { data, error } = await supabase
                .from("daily_tasks")
                .insert(task)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["daily_tasks"] });
            qc.invalidateQueries({ queryKey: ["recurring_tasks"] });
        },
        onError: (e: Error) =>
            toast({ title: "Erro ao criar tarefa", description: e.message, variant: "destructive" }),
    });
}

// ── atualizar ─────────────────────────────────────────────────────────────────
export function useUpdateDailyTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...update }: DailyTaskUpdate & { id: number }) => {
            const { data, error } = await supabase
                .from("daily_tasks")
                .update(update)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data as DailyTask;
        },
        onSuccess: (updated) => {
            qc.invalidateQueries({ queryKey: ["daily_tasks"] });
            qc.invalidateQueries({ queryKey: ["recurring_tasks"] });
            // quando marca como done uma tarefa recorrente ativa → cria próxima ocorrência
            void spawnNextRecurrence(updated, qc);
        },
        onError: (e: Error) =>
            toast({ title: "Erro ao atualizar tarefa", description: e.message, variant: "destructive" }),
    });
}

async function spawnNextRecurrence(task: DailyTask, qc: ReturnType<typeof useQueryClient>) {
    if (!task.done) return;
    if (task.recurrence === "none" || !task.recurrence_active) return;

    const base = new Date(task.scheduled_date);
    let next: Date;
    if (task.recurrence === "daily")   { next = new Date(base); next.setDate(base.getDate() + 1); }
    else if (task.recurrence === "weekly")  { next = new Date(base); next.setDate(base.getDate() + 7); }
    else { next = new Date(base); next.setMonth(base.getMonth() + 1); }

    const nextDate = next.toISOString().split("T")[0];
    const today    = new Date().toISOString().split("T")[0];
    // não cria se já existe uma igual no próximo dia
    const { data: exists } = await supabase
        .from("daily_tasks")
        .select("id")
        .eq("title", task.title)
        .eq("scheduled_date", nextDate)
        .maybeSingle();
    if (exists) return;

    await supabase.from("daily_tasks").insert({
        title:             task.title,
        notes:             task.notes,
        done:              false,
        priority:          task.priority,
        source:            task.source,
        source_id:         task.source_id,
        scheduled_date:    nextDate,
        recurrence:        task.recurrence,
        recurrence_active: task.recurrence_active,
    });
    qc.invalidateQueries({ queryKey: ["daily_tasks", nextDate] });
    qc.invalidateQueries({ queryKey: ["daily_tasks", today] });
}

// ── deletar ───────────────────────────────────────────────────────────────────
export function useDeleteDailyTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { error } = await supabase.from("daily_tasks").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["daily_tasks"] });
            qc.invalidateQueries({ queryKey: ["recurring_tasks"] });
        },
        onError: (e: Error) =>
            toast({ title: "Erro ao remover tarefa", description: e.message, variant: "destructive" }),
    });
}
