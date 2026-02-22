import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface GithubIssue {
  id: number;
  lead_id: number | null;
  projeto_id: number | null;
  deal_id: number | null;
  gh_id: number;
  title: string;
  state: string;
  url: string | null;
  data: Record<string, unknown> | null;
  synced_at: string;
}

export function useGithubIssues(leadId?: number, projetoId?: number, dealId?: number) {
  return useQuery({
    queryKey: ["github_issues", leadId, projetoId, dealId],
    queryFn: async () => {
      let q = supabase
        .from("github_issues")
        .select("*")
        .order("gh_id", { ascending: true });
      if (dealId) q = q.eq("deal_id", dealId);
      else if (leadId) q = q.eq("lead_id", leadId);
      else if (projetoId) q = q.eq("projeto_id", projetoId);
      const { data, error } = await q;
      if (error) throw error;
      return data as GithubIssue[];
    },
    enabled: !!(leadId || projetoId || dealId),
  });
}

export function useAllGithubIssues() {
  return useQuery({
    queryKey: ["github_issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("github_issues")
        .select("*")
        .eq("state", "open");
      if (error) throw error;
      return data as GithubIssue[];
    },
  });
}

function extractRepoPath(repoUrl: string): string | null {
  try {
    const url = new URL(repoUrl.startsWith("http") ? repoUrl : `https://${repoUrl}`);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  } catch {}
  const parts = repoUrl.split("/").filter(Boolean);
  if (parts.length >= 2) return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  return null;
}

export function useSyncGithubIssues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      repoUrl,
      leadId,
      projetoId,
      dealId,
    }: {
      repoUrl: string;
      leadId?: number;
      projetoId?: number;
      dealId?: number;
    }) => {
      const repoPath = extractRepoPath(repoUrl);
      if (!repoPath) throw new Error("URL do repositório inválida");

      const res = await fetch(
        `https://api.github.com/repos/${repoPath}/issues?state=all&per_page=100`
      );
      if (!res.ok) throw new Error(`GitHub API: ${res.status} ${res.statusText}`);
      const issues = await res.json();
      if (!Array.isArray(issues)) throw new Error("Resposta inesperada da API GitHub");

      // Limpa issues antigas do deal/lead/projeto
      if (dealId) await supabase.from("github_issues").delete().eq("deal_id", dealId);
      else if (leadId) await supabase.from("github_issues").delete().eq("lead_id", leadId);
      else if (projetoId) await supabase.from("github_issues").delete().eq("projeto_id", projetoId);

      if (issues.length === 0) return [];

      const rows = issues.map((issue: Record<string, unknown>) => ({
        lead_id: leadId ?? null,
        projeto_id: projetoId ?? null,
        deal_id: dealId ?? null,
        gh_id: issue.number as number,
        title: issue.title as string,
        state: issue.state as string,
        url: issue.html_url as string,
        data: {
          labels: issue.labels,
          body: issue.body,
          created_at: issue.created_at,
        } as Record<string, unknown>,
        synced_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase.from("github_issues").insert(rows).select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({
        queryKey: ["github_issues", vars.leadId, vars.projetoId, vars.dealId],
      });
      qc.invalidateQueries({ queryKey: ["github_issues"] });
      toast({ title: `Sync concluído! ${data?.length ?? 0} issues importadas.` });
    },
    onError: (e: Error) =>
      toast({ title: "Erro no sync GitHub", description: e.message, variant: "destructive" }),
  });
}
