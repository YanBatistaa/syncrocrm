
-- ============================================================
-- SyncroCRM Database Schema
-- ============================================================

-- LEADS table
CREATE TABLE public.leads (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  repo_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in-progress', 'done')),
  deadline DATE,
  notes TEXT,
  github_sync BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DEALS table
CREATE TABLE public.deals (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT REFERENCES public.leads(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  value DECIMAL(10,2) DEFAULT 0,
  stage VARCHAR(50) NOT NULL DEFAULT 'prospect' CHECK (stage IN ('prospect', 'negotiation', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROJETOS PESSOAIS table
CREATE TABLE public.projetos_pessoais (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  repo_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'dev', 'test', 'done')),
  progress SMALLINT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GITHUB ISSUES table
CREATE TABLE public.github_issues (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT REFERENCES public.leads(id) ON DELETE CASCADE,
  projeto_id BIGINT REFERENCES public.projetos_pessoais(id) ON DELETE CASCADE,
  gh_id INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  state VARCHAR(20) DEFAULT 'open',
  url TEXT,
  data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_deadline ON public.leads(deadline);
CREATE INDEX idx_leads_github_sync ON public.leads(github_sync);
CREATE INDEX idx_deals_lead_id ON public.deals(lead_id);
CREATE INDEX idx_deals_stage ON public.deals(stage);
CREATE INDEX idx_projetos_status ON public.projetos_pessoais(status);
CREATE INDEX idx_projetos_progress ON public.projetos_pessoais(progress);
CREATE INDEX idx_github_issues_synced_at ON public.github_issues(synced_at);
CREATE INDEX idx_github_issues_lead_id ON public.github_issues(lead_id);
CREATE INDEX idx_github_issues_projeto_id ON public.github_issues(projeto_id);

-- ============================================================
-- VIEWS for aggregated data
-- ============================================================
CREATE VIEW public.leads_pipeline AS
  SELECT 
    status,
    COUNT(*) as count,
    AVG(CASE WHEN deadline IS NOT NULL THEN (deadline - CURRENT_DATE) ELSE NULL END) as avg_days_to_deadline
  FROM public.leads
  GROUP BY status;

CREATE VIEW public.projetos_summary AS
  SELECT 
    status,
    AVG(progress) as avg_progress,
    COUNT(*) as count
  FROM public.projetos_pessoais
  GROUP BY status;

-- ============================================================
-- AUTO-CLEANUP TRIGGER: delete github_issues older than 90 days
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_github_issues()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.github_issues 
  WHERE synced_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Function to be called by trigger on new inserts
CREATE OR REPLACE FUNCTION public.trigger_cleanup_github_issues()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.cleanup_old_github_issues();
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_github_issues_on_insert
  AFTER INSERT ON public.github_issues
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_cleanup_github_issues();

-- ============================================================
-- RLS: Disabled (solo personal tool, no auth needed)
-- ============================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos_pessoais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_issues ENABLE ROW LEVEL SECURITY;

-- Allow all operations (personal tool, no multi-user)
CREATE POLICY "allow_all_leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_deals" ON public.deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_projetos" ON public.projetos_pessoais FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_github_issues" ON public.github_issues FOR ALL USING (true) WITH CHECK (true);
