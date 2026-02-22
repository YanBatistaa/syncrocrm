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
}

export type DailyTaskInsert = Omit<DailyTask, "id" | "created_at">;
export type DailyTaskUpdate = Partial<DailyTaskInsert>;

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
        },
        onError: (e: Error) =>
            toast({ title: "Erro ao criar tarefa", description: e.message, variant: "destructive" }),
    });
}

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
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["daily_tasks"] });
        },
        onError: (e: Error) =>
            toast({ title: "Erro ao atualizar tarefa", description: e.message, variant: "destructive" }),
    });
}

export function useDeleteDailyTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { error } = await supabase.from("daily_tasks").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["daily_tasks"] });
        },
        onError: (e: Error) =>
            toast({ title: "Erro ao remover tarefa", description: e.message, variant: "destructive" }),
    });
}
