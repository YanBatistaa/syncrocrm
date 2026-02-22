import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface DealFile {
  id: number;
  deal_id: number;
  user_id: string;
  name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
}

const BUCKET = "deal-files";

// ── utils ────────────────────────────────────────────────────────────────────
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileIcon(mime: string): string {
  if (mime === "application/pdf") return "📄";
  if (mime.includes("word") || mime.includes("document")) return "📝";
  if (mime.includes("sheet") || mime.includes("excel")) return "📊";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "📊";
  if (mime.startsWith("image/")) return "🖼️";
  if (mime.includes("zip") || mime.includes("rar")) return "📦";
  return "📁";
}

// ── list files ───────────────────────────────────────────────────────────────
export function useDealFiles(dealId?: number) {
  return useQuery({
    queryKey: ["deal-files", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_files")
        .select("*")
        .eq("deal_id", dealId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DealFile[];
    },
    enabled: !!dealId,
  });
}

// ── upload ───────────────────────────────────────────────────────────────────
export function useUploadDealFile() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ dealId, file }: { dealId: number; file: File }) => {
      if (!user) throw new Error("Unauthenticated");

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${dealId}/${Date.now()}_${file.name}`;

      // 1. upload para o storage
      const { error: storageErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false });
      if (storageErr) throw storageErr;

      // 2. registra na tabela
      const { data, error: dbErr } = await supabase
        .from("deal_files")
        .insert({
          deal_id: dealId,
          user_id: user.id,
          name: file.name,
          size: file.size,
          mime_type: file.type,
          storage_path: path,
        })
        .select()
        .single();
      if (dbErr) {
        // rollback storage se DB falhar
        await supabase.storage.from(BUCKET).remove([path]);
        throw dbErr;
      }
      return data as DealFile;
    },
    onSuccess: (_, { dealId }) => {
      qc.invalidateQueries({ queryKey: ["deal-files", dealId] });
      toast({ title: "Arquivo enviado!" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao enviar arquivo", description: e.message, variant: "destructive" }),
  });
}

// ── download / view ──────────────────────────────────────────────────────────
export function useGetDealFileUrl() {
  return async (storagePath: string, forDownload = false): Promise<string> => {
    if (forDownload) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, 60);
      if (error) throw error;
      return data.signedUrl;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
  };
}

// ── delete ───────────────────────────────────────────────────────────────────
export function useDeleteDealFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dealId, storagePath }: { id: number; dealId: number; storagePath: string }) => {
      // remove do storage
      await supabase.storage.from(BUCKET).remove([storagePath]);
      // remove do DB
      const { error } = await supabase.from("deal_files").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { dealId }) => {
      qc.invalidateQueries({ queryKey: ["deal-files", dealId] });
      toast({ title: "Arquivo removido." });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
  });
}
