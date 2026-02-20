# 🔷 SyncroCRM

> CRM pessoal para solo devs — gerencie leads, projetos e workflows em um único lugar.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Supabase-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Funcionalidades

- **Pipeline de Leads** — Kanban e tabela com status, prazo colorido e valor total dos deals
- **Deals por Lead** — Registre projetos com valor (R$) e estágio diretamente no lead
- **GitHub Sync** — Sincronize issues de repositórios públicos sem precisar de token
- **Projetos Pessoais** — Kanban separado para seus projetos com barra de progresso
- **Workflow Diário** — Timer de 9h com checklist automática de tarefas do dia
- **Dashboard** — KPIs, pipeline charts e resumo de tudo em um painel

---

## 🛠️ Tech Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + TypeScript + Vite |
| Estilo | Tailwind CSS + ShadCN/UI |
| Banco de Dados | Supabase (PostgreSQL) |
| Data Fetching | TanStack React Query |
| Charts | Recharts |
| Deploy | Coolify (self-hosted VPS) |

---

## 🗄️ Estrutura do Banco
```bash
leads → pipeline de clientes
deals → projetos/valores vinculados a leads
projetos_pessoais → projetos próprios com progresso 0-100
github_issues → issues sincronizadas (TTL 90 dias)


``` 
---

## 🚀 Rodando localmente

```bash
# Clone o repositório
git clone https://github.com/seu-user/syncro-flow.git
cd syncro-flow

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# Rode em desenvolvimento
npm run dev
```  

## 📁 Estrutura de Pastas

```bash
text
src/
├── pages/
│   ├── Dashboard.tsx
│   ├── Leads.tsx
│   ├── Projetos.tsx
│   └── Workflow.tsx
├── components/
│   ├── leads/
│   │   ├── LeadForm.tsx
│   │   ├── LeadDetailSheet.tsx
│   │   ├── LeadTableRow.tsx
│   │   ├── DealForm.tsx
│   │   ├── DealItem.tsx
│   │   ├── IssueItem.tsx
│   │   ├── DeadlineBadge.tsx
│   │   ├── StatusQuickChange.tsx
│   │   └── CopyButton.tsx
│   └── ui/          ← ShadCN components
└── hooks/
    ├── useLeads.ts
    ├── useDeals.ts
    └── useGithubIssues.ts
```  
## 📌 Roadmap

- [x] Aba Leads com pipeline e deals
- [x] GitHub Issues sync
- [x] Componentização da aba Leads
- [ ] Dashboard com KPIs e charts
- [ ] Aba Projetos Pessoais
- [ ] Workflow diário com timer 9h
- [ ] Deploy no VPS via Coolify


👤 Autor
Feito por Yan Batista — uso pessoal, solo dev life. 🚀

