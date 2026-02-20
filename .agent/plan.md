
## SyncroCRM – Plan

A personal, dark-themed CRM dashboard built for a solo developer to manage client leads and personal projects. Here's what we'll build:

---

### 🗄️ Database (Supabase)
Set up 4 tables:
- **leads** – Client leads with name, company, repo URL, status, deadline, notes
- **deals** – Linked to leads with title, value, and deal stage
- **projetos_pessoais** – Personal projects (Roblox/MU scripts, PWAs) with progress 0–100
- **github_issues** – Cached issues from synced repos (with 90-day auto-cleanup trigger)

Plus two database views for aggregated pipeline and project summaries.

---

### 🏗️ App Layout
- **Dark minimal sidebar** with collapsible mini mode (icons only when collapsed)
- Navigation: Dashboard, Leads, Projetos, Workflow

---

### 📊 Page 1 – Dashboard
- KPI cards: Total leads, open deals value, projects in progress, pending issues
- **Kanban board** showing leads grouped by status (New / In Progress / Done) with drag-to-reorder columns
- Pipeline bar chart (leads per stage) and projects progress summary using Recharts
- "Tarefas Hoje" panel: leads with deadlines approaching + projects below 80% progress

---

### 👥 Page 2 – Leads
- Table view of all leads with status badges and deadline indicators
- Click a lead → Detail panel/drawer with:
  - Edit form (name, company, repo URL, deadline, notes)
  - Deals list (add/edit deals with value and stage)
  - GitHub Sync button (fetches issues from the repo URL via GitHub REST API – public repos, no token needed)
  - Issues table showing synced GitHub issues

---

### 🚀 Page 3 – Projetos Pessoais
- Kanban board grouped by status (Idea / Dev / Test / Done)
- Progress bar on each project card (0–100%)
- Add/edit project modal with name, repo URL, progress slider, notes

---

### ⏰ Page 4 – Workflow Diário
- **9-hour daily work timer** with start/pause/reset controls
- Auto-query at start of day: surfaces leads with deadlines within 7 days + projects under 80% progress
- "Tarefas de Hoje" checklist generated from those queries
- In-app toast/banner alerts when timer milestones hit (3h, 6h, 9h)
- Daily summary card showing completed vs pending tasks

---

### ⚙️ Optimizations Built-In
- Database trigger to auto-delete GitHub issues older than 90 days
- Indexes on status, deadline, and github_sync columns
- Paginated queries to stay within Supabase free tier limits
