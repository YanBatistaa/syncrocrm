import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Usa o tipo Json do Supabase diretamente
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Automation {
    id: number;
    name: string;
    trigger_type:
    | "deadline_approaching"
    | "no_progress"
    | "new_lead"
    | "end_of_day";
    trigger_value: Json;
    webhook_url: string;
    message_template: string;
    active: boolean;
    last_fired_at: string | null;
    created_at: string;
}

export type AutomationInsert = Omit<Automation, "id" | "created_at" | "last_fired_at">;
export type AutomationUpdate = Partial<AutomationInsert>;

export const TRIGGER_LABELS: Record<Automation["trigger_type"], string> = {
    deadline_approaching: "Prazo chegando",
    no_progress: "Projeto sem progresso",
    new_lead: "Novo lead criado",
    end_of_day: "Resumo do dia (18h)",
};

export const TRIGGER_DESCRIPTIONS: Record<Automation["trigger_type"], string> = {
    deadline_approaching: "Dispara quando um lead tem prazo em 1 dia",
    no_progress: "Dispara quando um projeto não tem progresso há X dias",
    new_lead: "Dispara imediatamente quando um novo lead é criado",
    end_of_day: "Dispara todo dia às 18h com resumo de leads e projetos",
};

export const DEFAULT_TEMPLATES: Record<Automation["trigger_type"], string> = {
    deadline_approaching:
        "🔴 *Prazo chegando!*\nLead: {{lead.name}}\nEmpresa: {{lead.company}}\nPrazo: {{lead.deadline}}",
    no_progress:
        "⚠️ *Projeto parado!*\nProjeto: {{projeto.name}}\nProgresso: {{projeto.progress}}%\nÚltima atualização: {{projeto.updated_at}}",
    new_lead:
        "🟢 *Novo lead cadastrado!*\nNome: {{lead.name}}\nEmpresa: {{lead.company}}\nStatus: {{lead.status}}",
    end_of_day:
        "📋 *Resumo do dia — SyncroCRM*\n\nLeads ativos: {{stats.leads_active}}\nProjetos em dev: {{stats.projetos_dev}}\nTarefas concluídas hoje: {{stats.tasks_done}}\nPrazos esta semana: {{stats.deadlines_week}}",
};

export function useAutomations() {
    return useQuery({
        queryKey: ["automations"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("automations")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data as unknown as Automation[];
        },
    });
}

export function useCreateAutomation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (automation: AutomationInsert) => {
            const { data, error } = await supabase
                .from("automations")
                .insert(automation as any)
                .select()
                .single();
            if (error) throw error;
            return data as unknown as Automation;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["automations"] });
            toast({ title: "Automação criada!" });
        },
        onError: (e: Error) =>
            toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });
}

export function useUpdateAutomation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...update }: AutomationUpdate & { id: number }) => {
            const { data, error } = await supabase
                .from("automations")
                .update(update as any)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data as unknown as Automation;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["automations"] });
            toast({ title: "Automação atualizada!" });
        },
        onError: (e: Error) =>
            toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });
}

export function useDeleteAutomation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { error } = await supabase
                .from("automations")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["automations"] });
            toast({ title: "Automação removida." });
        },
        onError: (e: Error) =>
            toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });
}
