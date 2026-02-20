import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Lead {
  id: number;
  name: string;
  company: string | null;
  repo_url: string | null;
  status: "new" | "in-progress" | "done";
  deadline: string | null;
  notes: string | null;
  github_sync: boolean;
  created_at: string;
}

export type LeadInsert = Omit<Lead, "id" | "created_at">;
export type LeadUpdate = Partial<LeadInsert>;

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: LeadInsert) => {
      const { data, error } = await supabase.from("leads").insert(lead).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead criado com sucesso!" });
    },
    onError: (e: Error) => toast({ title: "Erro ao criar lead", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: LeadUpdate & { id: number }) => {
      const { data, error } = await supabase.from("leads").update(update).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead atualizado!" });
    },
    onError: (e: Error) => toast({ title: "Erro ao atualizar lead", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead removido." });
    },
    onError: (e: Error) => toast({ title: "Erro ao remover lead", description: e.message, variant: "destructive" }),
  });
}
