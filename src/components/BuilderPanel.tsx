import { useState, useEffect, useRef, useMemo } from "react";
import {
  STEP_TEMPLATES, STEP_CATEGORIES,
  getCompetitorCost, type PriceTier, type StepCategory,
  type SquaddPlanId, SQUADD_PLANS,
} from "@/data/templates";
import { FlowData, FlowNode } from "@/data/flowTypes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Globe, FileText, Share2, ClipboardList, UserPlus, Footprints, Newspaper, Users,
  MessageCircle, Mail, MessageSquare, Calendar, GitBranch, Tag, Bell, BellRing,
  Zap, Bot, Mic, Filter, Plus, Trash2, ChevronRight, Star,
  Download, Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

const allIcons: Record<string, React.FC<{ className?: string }>> = {
  Globe, FileText, Share2, ClipboardList, UserPlus, Footprints, Newspaper, Users,
  MessageCircle, Mail, MessageSquare, Calendar, GitBranch, Tag, Bell, BellRing,
  Zap, Bot, Mic, Filter, Star,
};

/** Tailwind color classes per category pill */
const PILL_COLORS: Record<string, { active: string; idle: string; dot: string }> = {
  sky:     { active: "bg-sky-500/20 text-sky-200 border-sky-500/40 shadow-[0_0_6px_rgba(56,189,248,0.15)]",       idle: "text-sky-300/70 border-sky-500/20 hover:bg-sky-500/10 hover:border-sky-500/30",       dot: "bg-sky-400" },
  emerald: { active: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-[0_0_6px_rgba(52,211,153,0.15)]", idle: "text-emerald-300/70 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30", dot: "bg-emerald-400" },
  orange:  { active: "bg-orange-500/20 text-orange-200 border-orange-500/40 shadow-[0_0_6px_rgba(251,146,60,0.15)]",   idle: "text-orange-300/70 border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/30",   dot: "bg-orange-400" },
  violet:  { active: "bg-violet-500/20 text-violet-200 border-violet-500/40 shadow-[0_0_6px_rgba(167,139,250,0.15)]",  idle: "text-violet-300/70 border-violet-500/20 hover:bg-violet-500/10 hover:border-violet-500/30",  dot: "bg-violet-400" },
  pink:    { active: "bg-pink-500/20 text-pink-200 border-pink-500/40 shadow-[0_0_6px_rgba(244,114,182,0.15)]",      idle: "text-pink-300/70 border-pink-500/20 hover:bg-pink-500/10 hover:border-pink-500/30",      dot: "bg-pink-400" },
};

interface BuilderPanelProps {
  flowData: FlowData;
  highlightedTemplates: string[];
  totalExternal: number;
  savings: number;
  effectivePrice: number;
  selectedPlan: SquaddPlanId;
  priceTier: PriceTier;
  onAddStep: (templateId: string, afterId?: string, branch?: string) => void;
  onRemoveStep: (id: string) => void;
  onReset: () => void;
  insertAfterId?: string | null;
  onClearInsertAfter?: () => void;
  onExportPdf?: () => void;
  onSetStepsOpen?: (open: boolean) => void;
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(value);
  const [popping, setPopping] = useState(false);
  const [flashColor, setFlashColor] = useState<"green" | "red" | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current === value) return;
    const direction = value > prevRef.current ? "green" : "red";
    prevRef.current = value;
    setPopping(true);
    setFlashColor(direction);

    const start = displayed;
    const diff = value - start;
    const duration = 400;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    const popTimeout = setTimeout(() => setPopping(false), 400);
    const flashTimeout = setTimeout(() => setFlashColor(null), 400);
    return () => { clearTimeout(popTimeout); clearTimeout(flashTimeout); };
  }, [value]);

  return (
    <span className={`inline-block transition-colors duration-slow ${popping ? "animate-count-pop" : ""} ${flashColor === "green" ? "text-green-400" : flashColor === "red" ? "text-red-400" : ""}`}>
      {displayed}
    </span>
  );
}

export function BuilderPanel({
  flowData,
  highlightedTemplates,
  totalExternal,
  savings,
  effectivePrice,
  selectedPlan,
  priceTier,
  onAddStep,
  onRemoveStep,
  onReset,
  insertAfterId,
  onClearInsertAfter,
  onExportPdf,
  onSetStepsOpen,
}: BuilderPanelProps) {
  const [stepsOpen, setStepsOpen] = useState(true);
  const [costsOpen, setCostsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<StepCategory | null>(null);

  useEffect(() => {
    if (insertAfterId) setStepsOpen(true);
  }, [insertAfterId]);

  const handleAddStep = (templateId: string) => {
    if (insertAfterId) {
      onAddStep(templateId, insertAfterId);
      onClearInsertAfter?.();
      toast.success("Step inserito dopo il nodo selezionato");
    } else {
      onAddStep(templateId);
      toast.success("Step aggiunto al flusso");
    }
  };

  const handleRemoveStep = (id: string) => {
    onRemoveStep(id);
    toast.success("Step rimosso");
  };

  const handleReset = () => {
    onReset();
    toast.success("Flusso resettato");
  };

  const steps = flowData.nodes.filter(n => n.type !== "source" && n.type !== "converge");
  const isEmpty = flowData.nodes.length === 0;
  const savingsPercent = totalExternal > 0 && savings > 0 ? Math.round((savings / totalExternal) * 100) : 0;
  const costBarWidth = totalExternal > 0 ? Math.min(100, Math.round((effectivePrice / totalExternal) * 100)) : 100;
  const planName = SQUADD_PLANS[selectedPlan].name;

  const filteredTemplates = useMemo(() => {
    if (!activeFilter) return STEP_TEMPLATES;
    return STEP_TEMPLATES.filter(t => t.category === activeFilter);
  }, [activeFilter]);

  return (
    <div className="w-[340px] shrink-0 border-l border-border bg-card flex flex-col h-full">
      <div className="flex-1 overflow-auto p-3 space-y-4">

        {/* ── Header ────────────────────────────────── */}
        <div className="flex items-center justify-between pb-1 border-b border-border/50">
          <h2 className="font-mono text-2xs font-bold uppercase tracking-widest text-foreground">
            Costruisci Flusso
          </h2>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="font-mono text-3xs text-muted-foreground hover:text-foreground transition-colors">
                Reset
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Resettare il flusso?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione rimuovera tutte le fonti, step e condizioni dal flusso corrente. Non e reversibile.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Resetta tutto
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* ── Collapsible cost summary ────────────────── */}
        <Collapsible open={costsOpen} onOpenChange={setCostsOpen}>
          <CollapsibleTrigger className="w-full rounded-lg border border-border px-2.5 py-2 hover:bg-muted/30 transition-colors group">
            {savings > 0 ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ChevronRight className="w-2.5 h-2.5 text-muted-foreground transition-transform duration-200 ease-out group-data-[state=open]:rotate-90" />
                  <span className="font-mono text-2xs font-bold uppercase tracking-wide">Risparmio</span>
                  {savingsPercent > 0 && (
                    <span className="font-mono text-3xs text-muted-foreground">-{savingsPercent}%</span>
                  )}
                </div>
                <span className="font-mono text-sm font-bold tabular-nums">
                  <AnimatedNumber value={savings} /><span className="text-3xs text-muted-foreground font-normal">/m</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <ChevronRight className="w-2.5 h-2.5 text-muted-foreground transition-transform duration-200 ease-out group-data-[state=open]:rotate-90" />
                <span className="font-mono text-2xs text-muted-foreground">
                  {planName} {effectivePrice}/mese
                </span>
              </div>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="rounded-lg border border-border border-t-0 rounded-t-none px-2.5 pb-2.5 pt-2 space-y-2">
              {savings > 0 ? (
                <>
                  <div className="flex items-center justify-between font-mono text-2xs">
                    <span className="text-muted-foreground line-through tabular-nums">
                      {totalExternal}/mese
                    </span>
                    <span className="tabular-nums font-bold">
                      {planName} {effectivePrice}/mese
                    </span>
                  </div>

                  <div className="w-full h-0.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-foreground/50 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${costBarWidth}%` }}
                      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
                    />
                  </div>

                  <div className="flex items-baseline justify-between bg-muted/30 rounded px-2 py-1">
                    <span className="font-mono text-3xs text-muted-foreground uppercase">Annuale</span>
                    <span className="font-mono text-sm font-bold tabular-nums">
                      {savings * 12}<span className="text-3xs text-muted-foreground font-normal">/anno</span>
                    </span>
                  </div>
                </>
              ) : (
                <p className="font-mono text-2xs text-muted-foreground text-center py-1">
                  {planName} {effectivePrice}/mese — tutto incluso
                </p>
              )}

              {!isEmpty && onExportPdf && (
                <button
                  onClick={(e) => { e.stopPropagation(); onExportPdf(); }}
                  className="w-full flex items-center justify-center gap-1 font-mono text-2xs text-muted-foreground hover:text-foreground transition-colors py-1 border-t border-border/50 pt-2"
                >
                  <Download className="w-3 h-3" />
                  Esporta PDF
                </button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ── Insert after banner ───────────────────── */}
        {insertAfterId && (() => {
          const targetNode = flowData.nodes.find(n => n.id === insertAfterId);
          const targetName = targetNode?.label || "nodo";
          return (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/30 font-mono text-2xs animate-fade-in">
              <Plus className="w-3 h-3 text-primary shrink-0" />
              <span className="flex-1">Dopo: <strong>{targetName}</strong></span>
              <button
                onClick={onClearInsertAfter}
                className="text-muted-foreground hover:text-foreground transition-colors text-3xs"
              >
                Annulla
              </button>
            </div>
          );
        })()}

        {/* ── Steps with category pills ───────────────── */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <h3 className="font-mono text-2xs font-bold uppercase tracking-widest text-foreground/80">
              Step
            </h3>
          </div>

          {/* Category pill filters */}
          <div className="flex flex-wrap gap-1.5 p-1.5 rounded-lg bg-muted/20 border border-border/30">
            <button
              onClick={() => setActiveFilter(null)}
              className={`px-2.5 py-1 rounded-md font-mono text-2xs font-medium border transition-all duration-150 ${
                activeFilter === null
                  ? "bg-foreground/15 text-foreground border-foreground/25 shadow-sm"
                  : "text-muted-foreground/50 border-transparent hover:bg-muted/40 hover:text-muted-foreground"
              }`}
            >
              Tutti
            </button>
            {STEP_CATEGORIES.map((cat) => {
              const colors = PILL_COLORS[cat.color];
              const isActive = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(isActive ? null : cat.id)}
                  className={`px-2.5 py-1 rounded-md font-mono text-2xs font-medium border transition-all duration-150 flex items-center gap-1.5 ${
                    isActive ? colors.active : colors.idle
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Template list */}
          <div className="space-y-0.5">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((t) => {
                const Icon = allIcons[t.icon];
                const highlighted = highlightedTemplates.includes(t.id);
                const cost = getCompetitorCost(t.competitorId, priceTier);
                const cat = STEP_CATEGORIES.find(c => c.id === t.category);
                const dotColor = cat ? PILL_COLORS[cat.color]?.dot : "";

                return (
                  <motion.button
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => handleAddStep(t.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left font-mono text-2xs transition-colors duration-150 hover:bg-muted/60 active:scale-[0.97] ${
                      highlighted ? "bg-lime/5 ring-1 ring-lime/20 text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                    {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                    <span className="flex-1 min-w-0 truncate">{t.label}</span>
                    {cost > 0 && (
                      <span className="tabular-nums text-3xs text-muted-foreground shrink-0">{cost}</span>
                    )}
                    {highlighted ? (
                      <Sparkles className="w-2.5 h-2.5 text-lime shrink-0 animate-pulse-subtle" />
                    ) : (
                      <Plus className="w-2.5 h-2.5 text-muted-foreground/30 shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Current steps list ────────────────────── */}
        {steps.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="font-mono text-2xs font-bold uppercase tracking-widest text-muted-foreground">
                Nel Flusso
              </p>
              <span className="font-mono text-3xs text-muted-foreground tabular-nums">
                {steps.length} step
              </span>
            </div>
            <div className="space-y-px rounded-lg border border-border/50 overflow-hidden">
              {steps.map((s, i) => {
                const tpl = STEP_TEMPLATES.find(t => t.id === s.templateId);
                const Icon = tpl ? allIcons[tpl.icon] : null;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-1.5 group px-2 py-1 ${i % 2 === 0 ? "bg-muted/10" : ""} hover:bg-muted/30 transition-colors`}
                  >
                    {s.type === "condition" || s.type === "smart-condition" ? (
                      <GitBranch className="w-2.5 h-2.5 text-node-condition shrink-0" />
                    ) : Icon ? (
                      <Icon className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                    ) : (
                      <Zap className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                    )}
                    <span className={`font-mono text-3xs flex-1 truncate ${s.type === "condition" || s.type === "smart-condition" ? "text-node-condition font-bold" : ""}`}>
                      {s.label}
                    </span>
                    <button
                      onClick={() => handleRemoveStep(s.id)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-[opacity,color] duration-150 text-muted-foreground hover:text-destructive active:scale-[0.92] p-0.5 rounded"
                      aria-label={`Rimuovi ${s.label}`}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
