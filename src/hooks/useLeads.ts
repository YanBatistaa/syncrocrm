import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface Lead {
  id: number;
  user_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  repo_url: string | null;
  status: "new" | "in-progress" | "done";
  deadline: string | null;
  notes: string | null;
  github_sync: boolean;
  tags: string[] | null;
  archived: boolean;
  created_at: string;
}

export type LeadInsert = Omit<Lead, "id" | "created_at" | "user_id">;
export type LeadUpdate = Partial<LeadInsert>;

export function useLeads(includeArchived = false) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["leads", user?.id, includeArchived],
    queryFn: async () => {
      let q = supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (!includeArchived) q = q.eq("archived", false);
      const { data, error } = await q;
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!user,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (lead: LeadInsert) => {
      const { data, error } = await supabase
        .from("leads")
        .insert({ ...lead, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads", user?.id] });
      toast({ title: "Lead criado com sucesso!" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao criar lead", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...update }: LeadUpdate & { id: number }) => {
      const { data, error } = await supabase
        .from("leads")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads", user?.id] });
      toast({ title: "Lead atualizado!" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao atualizar lead", description: e.message, variant: "destructive" }),
  });
}

export function useArchiveLead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: number; archived: boolean }) => {
      const { error } = await supabase
        .from("leads")
        .update({ archived })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["leads", user?.id] });
      toast({ title: vars.archived ? "Lead arquivado." : "Lead restaurado!" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads", user?.id] });
      toast({ title: "Lead removido." });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao remover lead", description: e.message, variant: "destructive" }),
  });
}
