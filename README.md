# 🐉 Syncro CRM

> CRM pessoal para solo devs — gerencie leads, projetos e workflows com automações Discord.

![Status](https://img.shields.io/badge/status-produção-green)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Supabase-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Funcionalidades

### 📈 Leads & Deals
- **Pipeline Kanban + Tabela** — drag-and-drop entre 5 estágios (novo → ganho/perdido)
- **Deals por Lead** — vários projetos por cliente com valor (R$), descrição e progresso %
- **Prazo colorido** — badge verde/amarelo/vermelho conforme proximidade da deadline
- **Anexos** — upload de imagens/PDFs via Supabase Storage direto no lead
- **Copy-to-clipboard** — botões rápidos para copiar e-mail/telefone/PIX

### 🔗 Integrações
- **GitHub Issues Sync** — sincroniza issues de repos públicos e privados (com token opcional)
- **Discord Webhooks** — automações customizáveis por gatilho:
  - Prazo se aproximando (lead com deadline < 24h)
  - Lead sem progresso (status inalterado por X dias)
  - Novo lead criado
  - Resumo diário (fim do dia)

### 📅 Workflow Diário
- **Daily Board** — tarefas organizadas por prioridade (Urgente / Agendado / Backlog)
- **Tarefas atrasadas** — seção colapsável para reagendar ou marcar como feitas
- **Tarefas recorrentes** — crie tarefas que se repetem (diária, semanal, mensal) e gerencie no painel lateral
- **Tarefas de leads** — geração automática de urgentes para leads com prazo amanhã

### 📊 Dashboard
- **KPIs** — taxa de conversão, ticket médio, leads ativos, projetos em progresso
- **Charts** — pipeline por fase, deals por lead, projetos pessoais
- **Atividades recentes** — timeline de mudanças nos últimos 7 dias

### 📦 Projetos Pessoais
- **Kanban independente** — backlog, em progresso, concluído
- **Barra de progresso** — 0-100% manual por projeto
- **Labels coloridas** — organização visual por categoria/tipo

### 📱 PWA (Progressive Web App)
- **Instalación** — funciona como app nativo no celular e desktop
- **Popup de instalação** — banner automático com opção "não mostrar novamente"
- **Seção em Config** — botão direto para instalar + instruções por plataforma
- **Ícone customizado** — silhueta de dragão minimalista em gradiente roxo

---

## 🛠️ Tech Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilo | Tailwind CSS + shadcn/ui |
| Banco de Dados | Supabase (PostgreSQL + Storage) |
| Data Fetching | TanStack React Query v5 |
| Charts | Recharts |
| Formulários | React Hook Form + Zod |
| Drag & Drop | dnd-kit |
| Deploy | Vercel |

---

## 🗄️ Estrutura do Banco

```sql
leads              → pipeline de clientes (nome, empresa, status, deadline, valor)
deals              → projetos/valores vinculados a leads (n:1)
projetos_pessoais  → projetos próprios com progresso 0-100
github_issues      → issues sincronizadas (TTL 90 dias, cleanup automático)
lead_files         → anexos (storage path + metadata)
automations        → webhooks Discord com gatilhos e templates
daily_tasks        → tarefas diárias (manual + auto-geradas de leads)
user_config        → preferências (display_name, github_token)
```

---

## 🚀 Rodando localmente

```bash
# Clone o repositório
git clone https://github.com/YanBatistaa/syncrocrm.git
cd syncrocrm

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# Rode em desenvolvimento
npm run dev
```

### SQL inicial (Supabase)

Execute no SQL Editor do Supabase:

```sql
-- Campos de recorrência na tabela daily_tasks
ALTER TABLE public.daily_tasks
  ADD COLUMN IF NOT EXISTS recurrence        TEXT    NOT NULL DEFAULT 'none'
    CHECK (recurrence IN ('none','daily','weekly','monthly')),
  ADD COLUMN IF NOT EXISTS recurrence_active BOOLEAN NOT NULL DEFAULT TRUE;
```

---

## 📁 Estrutura de Pastas

```
src/
├── pages/
│   ├── Dashboard.tsx         # KPIs + charts + timeline
│   ├── Leads.tsx             # Pipeline kanban + tabela + detail sheet
│   ├── Projetos.tsx          # Kanban projetos pessoais
│   ├── Workflow.tsx          # Daily board + automações Discord
│   ├── Config.tsx            # PWA install + perfil + integrações
│   ├── Login.tsx
│   └── NotFound.tsx
├── components/
│   ├── leads/
│   │   ├── LeadForm.tsx
│   │   ├── LeadDetailSheet.tsx  # Sheet lateral com deals/issues/anexos
│   │   ├── LeadTableRow.tsx
│   │   ├── DealForm.tsx
│   │   ├── DealItem.tsx
│   │   ├── IssueItem.tsx
│   │   ├── DeadlineBadge.tsx
│   │   ├── StatusQuickChange.tsx
│   │   └── CopyButton.tsx
│   ├── DealDetailSheet.tsx   # Modal completo de deal com arquivos
│   ├── DealPageModal.tsx
│   ├── PWAInstallBanner.tsx # Popup bottom-center com checkbox
│   └── ui/                  # shadcn/ui components
├── hooks/
│   ├── useLeads.ts
│   ├── useDeals.ts
│   ├── useGithubIssues.ts
│   ├── useProjetos.ts
│   ├── useAutomations.ts
│   ├── useDailyTasks.ts      # + useOverdueTasks, useRecurringTasks
│   ├── usePWAInstall.ts      # BeforeInstallPrompt handler
│   └── useConfig.ts
└── integrations/
    └── supabase/
        └── client.ts
```

---

## 📌 Roadmap

- [x] Aba Leads com pipeline e deals
- [x] GitHub Issues sync (público + privado)
- [x] Dashboard com KPIs e charts
- [x] Aba Projetos Pessoais
- [x] Workflow diário com automações Discord
- [x] Tarefas recorrentes (diária/semanal/mensal)
- [x] Tarefas atrasadas com ações rápidas
- [x] PWA com instalação via popup e Config
- [x] Upload de arquivos nos deals
- [ ] Notificações push (PWA)
- [ ] Exportar relatórios em PDF
- [ ] Multi-idioma (PT/EN)

---

👤 **Autor**  
Feito por [Yan Batista](https://github.com/YanBatistaa) — uso pessoal, solo dev life. 🚀

🔗 **Deploy**  
[syncrocrm.vercel.app](https://syncrocrm.vercel.app) (ou o seu domínio customizado)
