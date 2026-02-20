import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Deal {
  id: number;
  lead_id: number;
  title: string;
  value: number;
  stage: "prospect" | "negotiation" | "closed";
  created_at: string;
}

export type DealInsert = Omit<Deal, "id" | "created_at">;

export function useDeals(leadId?: number) {
  return useQuery({
    queryKey: ["deals", leadId],
    queryFn: async () => {
      let q = supabase.from("deals").select("*").order("created_at", { ascending: false });
      if (leadId) q = q.eq("lead_id", leadId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Deal[];
    },
  });
}

export function useAllDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*");
      if (error) throw error;
      return data as Deal[];
    },
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (deal: DealInsert) => {
      const { data, error } = await supabase.from("deals").insert(deal).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["deals", vars.lead_id] });
      qc.invalidateQueries({ queryKey: ["deals"] });
      toast({ title: "Deal criado!" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
