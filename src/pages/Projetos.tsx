import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useAllDealsWithLead,
  useDeleteDeal,
  useUpdateDeal,
  DealWithLead,
} from "@/hooks/useDeals";
import DealPageModal from "@/components/DealPageModal";
import { Briefcase, DollarSign, Trash2, GripVertical, StickyNote } from "lucide-react";

const COLUMNS = [
  { id: "prospect",    label: "Prospect",    color: "hsl(var(--muted-foreground))" },
  { id: "negotiation", label: "Negociação",  color: "hsl(var(--status-progress))" },
  { id: "closed",      label: "Fechado",      color: "hsl(var(--status-done))" },
  { id: "lost",        label: "Perdido",      color: "hsl(var(--destructive))" },
] as const;

type Stage = "prospect" | "negotiation" | "closed" | "lost";

export default function Projetos() {
  const { data: deals = [], isLoading } = useAllDealsWithLead();
  const deleteDeal  = useDeleteDeal();
  const updateDeal  = useUpdateDeal();

  const [activeDeal,    setActiveDeal]    = useState<DealWithLead | null>(null);
  const [selectedDeal,  setSelectedDeal]  = useState<DealWithLead | null>(null);
  const [stageOverride, setStageOverride] = useState<Record<number, Stage>>({});
  const [wasDragging,   setWasDragging]   = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const getStage = (deal: DealWithLead): Stage =>
    (stageOverride[deal.id] ?? deal.stage) as Stage;

  const totalPipeline = deals
    .filter((d) => getStage(d) !== "closed" && getStage(d) !== "lost")
    .reduce((a, d) => a + (d.value || 0), 0);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setWasDragging(true);
    const deal = deals.find((d) => d.id === Number(e.active.id));
    setActiveDeal(deal ?? null);
  }, [deals]);

  const handleDragOver = useCallback((e: DragOverEvent) => {
    const { over } = e;
    if (!over || !activeDeal) return;
    const overId = String(over.id);
    const colMatch = COLUMNS.find((c) => c.id === overId);
    if (colMatch) {
      setStageOverride((p) => ({ ...p, [activeDeal.id]: colMatch.id as Stage }));
      return;
    }
    const overDeal = deals.find((d) => d.id === Number(overId));
    if (overDeal) {
      const ts = (stageOverride[overDeal.id] ?? overDeal.stage) as Stage;
      setStageOverride((p) => ({ ...p, [activeDeal.id]: ts }));
    }
  }, [activeDeal, deals, stageOverride]);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    setActiveDeal(null);
    setTimeout(() => setWasDragging(false), 0);
    if (!over) {
      setStageOverride((p) => { const n = { ...p }; delete n[Number(active.id)]; return n; });
      return;
    }
    const dealId  = Number(active.id);
    const deal    = deals.find((d) => d.id === dealId);
    if (!deal) return;
    const newStage = stageOverride[dealId];
    if (newStage && newStage !== deal.stage) {
      updateDeal.mutate({ id: dealId, stage: newStage }, {
        onSettled: () => setStageOverride((p) => { const n = { ...p }; delete n[dealId]; return n; }),
      });
    } else {
      setStageOverride((p) => { const n = { ...p }; delete n[dealId]; return n; });
    }
  }, [deals, stageOverride, updateDeal]);

  if (isLoading) {
    return <div className="text-center py-16 text-muted-foreground text-sm">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Projetos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {deals.filter((d) => getStage(d) !== "closed" && getStage(d) !== "lost").length} ativos
          {totalPipeline > 0 && <> · R$ {totalPipeline.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</>}
        </p>
      </div>

      {deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <Briefcase className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Nenhum deal cadastrado ainda.</p>
          <p className="text-muted-foreground/60 text-xs">Adicione deals nos seus Leads para eles aparecerem aqui.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map((col) => {
              const colDeals = deals.filter((d) => getStage(d) === col.id);
              return (
                <KanbanColumn
                  key={col.id}
                  col={col}
                  deals={colDeals}
                  onDelete={(id) => deleteDeal.mutate(id)}
                  onCardClick={(deal) => { if (!wasDragging) setSelectedDeal(deal); }}
                />
              );
            })}
          </div>
          <DragOverlay>
            {activeDeal
              ? <DealCard deal={activeDeal} onDelete={() => {}} onCardClick={() => {}} isOverlay />
              : null}
          </DragOverlay>
        </DndContext>
      )}

      <DealPageModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </div>
  );
}

function KanbanColumn({ col, deals, onDelete, onCardClick }: {
  col: { id: string; label: string; color: string };
  deals: DealWithLead[];
  onDelete: (id: number) => void;
  onCardClick: (deal: DealWithLead) => void;
}) {
  const { setNodeRef, isOver } = useSortable({ id: col.id, data: { type: "column" } });
  const colValue = deals.reduce((a, d) => a + (d.value || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border transition-colors min-h-[460px] flex flex-col ${
        isOver ? "border-primary/50 bg-primary/5" : "border-border/60 bg-card/30"
      }`}
    >
      <div className="flex items-center justify-between p-3 pb-2.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: col.color }}>{col.label}</span>
          <span className="text-xs rounded-full px-1.5 py-0.5 font-medium" style={{ color: col.color, background: `${col.color}20` }}>{deals.length}</span>
        </div>
        {colValue > 0 && (
          <span className="text-xs text-muted-foreground">
            R$ {colValue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
          </span>
        )}
      </div>
      <div className="flex-1 p-2 space-y-2">
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onDelete={() => onDelete(deal.id)} onCardClick={onCardClick} />
          ))}
        </SortableContext>
        {deals.length === 0 && (
          <div className="flex items-center justify-center h-24">
            <p className="text-xs text-muted-foreground/25">Solte aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DealCard({ deal, onDelete, onCardClick, isOverlay = false }: {
  deal: DealWithLead;
  onDelete: () => void;
  onCardClick: (deal: DealWithLead) => void;
  isOverlay?: boolean;
}) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging,
  } = useSortable({ id: deal.id, data: { type: "deal" } });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isSortableDragging ? 0.3 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onCardClick(deal)}
      className={`rounded-lg border bg-card p-3 space-y-2 group select-none cursor-pointer ${
        isOverlay
          ? "shadow-2xl border-primary/40 rotate-1 scale-[1.03]"
          : "border-border/60 hover:border-primary/40 hover:shadow-sm transition-all"
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/25 hover:text-muted-foreground transition-colors"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <p className="text-xs font-medium text-foreground flex-1 leading-snug">{deal.title}</p>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <Briefcase className="w-3 h-3 text-primary/50 flex-shrink-0" />
        <span className="text-xs text-primary/70 truncate">{deal.lead_name}</span>
        {deal.lead_company && <span className="text-xs text-muted-foreground/50 truncate">· {deal.lead_company}</span>}
      </div>
      <div className="flex items-center justify-between">
        {deal.value > 0 ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <DollarSign className="w-3 h-3" />
            R$ {deal.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        ) : <div />}
        {deal.notes && <StickyNote className="w-3 h-3 text-primary/40" />}
      </div>
    </div>
  );
}
