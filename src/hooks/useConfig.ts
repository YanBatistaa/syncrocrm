import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface UserConfig {
  id: string;
  user_id: string;
  display_name: string | null;
  github_token: string | null;
  created_at: string;
  updated_at: string;
}

export function useConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["user-config", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserConfig | null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60, // 1 hora de cache para config
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<Pick<UserConfig, "display_name" | "github_token">>) => {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          { user_id: user!.id, ...updates, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-config", user?.id] });
      toast.success("Configurações salvas!");
    },
    onError: () => {
      toast.error("Erro ao salvar configurações.");
    },
  });

  return { config, isLoading, updateConfig };
}
