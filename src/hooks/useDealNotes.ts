import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface DealNote {
  id: number;
  deal_id: number;
  content: string;
  created_at: string;
}

export function useDealNotes(dealId: number | null) {
  return useQuery({
    queryKey: ["deal-notes", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_notes")
        .select("*")
        .eq("deal_id", dealId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DealNote[];
    },
    enabled: !!dealId,
  });
}

export function useCreateDealNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ deal_id, content }: { deal_id: number; content: string }) => {
      const { data, error } = await supabase
        .from("deal_notes")
        .insert({ deal_id, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["deal-notes", vars.deal_id] });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao salvar nota", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteDealNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, deal_id }: { id: number; deal_id: number }) => {
      const { error } = await supabase.from("deal_notes").delete().eq("id", id);
      if (error) throw error;
      return deal_id;
    },
    onSuccess: (deal_id) => {
      qc.invalidateQueries({ queryKey: ["deal-notes", deal_id] });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao remover nota", description: e.message, variant: "destructive" }),
  });
}
