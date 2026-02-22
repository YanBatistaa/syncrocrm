import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface Projeto {
  id: number;
  user_id: string;
  name: string;
  repo_url: string | null;
  status: "idea" | "dev" | "test" | "done";
  progress: number;
  notes: string | null;
  created_at: string;
}

export type ProjetoInsert = Omit<Projeto, "id" | "created_at" | "user_id">;
export type ProjetoUpdate = Partial<ProjetoInsert>;

export function useProjetos() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["projetos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projetos_pessoais")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Projeto[];
    },
    enabled: !!user,
  });
}

export function useCreateProjeto() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (projeto: ProjetoInsert) => {
      const { data, error } = await supabase
        .from("projetos_pessoais")
        .insert({ ...projeto, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projetos", user?.id] });
      toast({ title: "Projeto criado!" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateProjeto() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...update }: ProjetoUpdate & { id: number }) => {
      const { data, error } = await supabase
        .from("projetos_pessoais")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projetos", user?.id] });
      toast({ title: "Projeto atualizado!" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteProjeto() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("projetos_pessoais")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projetos", user?.id] });
      toast({ title: "Projeto removido." });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
