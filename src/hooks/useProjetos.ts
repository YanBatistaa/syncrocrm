import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Projeto {
  id: number;
  name: string;
  repo_url: string | null;
  status: "idea" | "dev" | "test" | "done";
  progress: number;
  notes: string | null;
  created_at: string;
}

export type ProjetoInsert = Omit<Projeto, "id" | "created_at">;
export type ProjetoUpdate = Partial<ProjetoInsert>;

export function useProjetos() {
  return useQuery({
    queryKey: ["projetos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projetos_pessoais")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Projeto[];
    },
  });
}

export function useCreateProjeto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projeto: ProjetoInsert) => {
      const { data, error } = await supabase.from("projetos_pessoais").insert(projeto).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projetos"] });
      toast({ title: "Projeto criado!" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateProjeto() {
  const qc = useQueryClient();
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
      qc.invalidateQueries({ queryKey: ["projetos"] });
      toast({ title: "Projeto atualizado!" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteProjeto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("projetos_pessoais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projetos"] });
      toast({ title: "Projeto removido." });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
