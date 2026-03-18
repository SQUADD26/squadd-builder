import { useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
} from "@xyflow/react";
import { SourceNode } from "@/components/flow/SourceNode";
import { ActionNode } from "@/components/flow/ActionNode";
import { ConditionNode } from "@/components/flow/ConditionNode";
import { ConvergeNode } from "@/components/flow/ConvergeNode";
import { ParallelNode } from "@/components/flow/ParallelNode";
import { SmartConditionNode } from "@/components/flow/SmartConditionNode";
import { InsertableEdge } from "@/components/flow/InsertableEdge";
import { X, TrendingUp, Clock, Target, DollarSign, Users, BarChart3, Presentation } from "lucide-react";
import { OfferOverlay } from "@/components/OfferOverlay";
import {
  type PriceTier,
  SOURCE_TEMPLATES,
  STEP_TEMPLATES,
  getCompetitorName,
  getCompetitorCost,
  getCompetitorCategory,
  getCompetitorAllNames,
  COMPETITOR_LOGOS,
} from "@/data/templates";
import { type FlowNode } from "@/data/flowTypes";
import { motion } from "motion/react";
import type { Node, Edge } from "@xyflow/react";

const nodeTypes = {
  sourceNode: SourceNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  convergeNode: ConvergeNode,
  parallelNode: ParallelNode,
  smartConditionNode: SmartConditionNode,
};

const edgeTypes = {
  insertable: InsertableEdge,
};

// ── Unique competitors helper ────────────────────────

interface CompetitorEntry {
  /** Primary name (tier-matched) */
  name: string;
  cost: number;
  compId: string;
  categoryLabel: string;
  logo: string;
  /** All names with logos for this category (may include both budget+premium) */
  allNames: { name: string; logo: string }[];
}

function collectUniqueCompetitors(
  nodes: FlowNode[],
  tier: PriceTier,
): CompetitorEntry[] {
  const seen = new Set<string>();
  const result: CompetitorEntry[] = [];
  for (const n of nodes) {
    if (!n.templateId) continue;
    const src = SOURCE_TEMPLATES.find((t) => t.id === n.templateId);
    const step = STEP_TEMPLATES.find((t) => t.id === n.templateId);
    const compId = src?.competitorId || step?.competitorId;
    if (!compId || seen.has(compId)) continue;
    seen.add(compId);
    const name = getCompetitorName(compId, tier);
    const cost = getCompetitorCost(compId, tier);
    const logo = COMPETITOR_LOGOS[name] || "";
    const categoryLabel = getCompetitorCategory(compId);
    const allNames = getCompetitorAllNames(compId);
    if (name) result.push({ name, cost, compId, categoryLabel, logo, allNames });
  }

  // "automazione" is always implicit — any flow with steps uses automations
  if (!seen.has("automazione") && nodes.length > 0) {
    seen.add("automazione");
    const name = getCompetitorName("automazione", tier);
    const cost = getCompetitorCost("automazione", tier);
    const logo = COMPETITOR_LOGOS[name] || "";
    const categoryLabel = getCompetitorCategory("automazione");
    const allNames = getCompetitorAllNames("automazione");
    if (name) result.push({ name, cost, compId: "automazione", categoryLabel, logo, allNames });
  }

  return result;
}

// ── AI Report Data (static) ─────────────────────────

const REPORT_SECTIONS = [
  {
    icon: Clock,
    title: "Efficienza operativa",
    stat: "-82%",
    statLabel: "tempo di risoluzione",
    body: "L'automazione dei processi riduce drasticamente i tempi operativi. Nel customer service, i tempi di risoluzione passano da 11 a 2 minuti. La produttività media aumenta del 14% grazie all'AI generativa, mentre i team commerciali recuperano fino al 60% del tempo oggi speso in attività di non-vendita.",
    highlights: [
      { value: "+14%", label: "produttività agenti" },
      { value: "13h", label: "risparmiate a settimana" },
    ],
    sources: [1, 2, 3],
  },
  {
    icon: Target,
    title: "Conversioni e vendite",
    stat: "+38%",
    statLabel: "tasso di conversione",
    body: "Il lead scoring predittivo trasforma il funnel commerciale. I tassi di conversione crescono fino al 32%, i cicli di vendita si accorciano del 28-30% e il win rate complessivo aumenta di oltre il 30%. Il valore medio dei contratti sale del 17-20%.",
    highlights: [
      { value: "-30%", label: "ciclo di vendita" },
      { value: "+30%", label: "tasso di chiusura" },
    ],
    sources: [4],
  },
  {
    icon: DollarSign,
    title: "Costo di acquisizione",
    stat: "-50%",
    statLabel: "CAC ridotto",
    body: "Il targeting basato su dati di prima parte e intento reale abbatte i costi di acquisizione. Nel B2B, le metodologie AI riducono il CAC del 30-37%. La personalizzazione su scala permette tagli fino al 50% con un'efficienza della spesa marketing migliorata del 10-30%.",
    highlights: [
      { value: "-37%", label: "CAC nel B2B" },
      { value: "+30%", label: "efficienza marketing" },
    ],
    sources: [5, 6],
  },
  {
    icon: BarChart3,
    title: "Ritorno pubblicitario",
    stat: "+32%",
    statLabel: "ROAS",
    body: "L'ottimizzazione automatica di budget, creatività e audience genera risultati impossibili per un operatore umano. Gli strumenti di advertising AI riducono il costo per azione del 17% e incrementano il ROAS del 32%, con uplift di conversioni tra il 10% e il 25% in tutti i settori.",
    highlights: [
      { value: "-17%", label: "costo per azione" },
      { value: "+25%", label: "uplift conversioni" },
    ],
    sources: [7],
  },
  {
    icon: Users,
    title: "Valore del cliente nel tempo",
    stat: "+25%",
    statLabel: "lifetime value",
    body: "Raccomandazioni AI e comunicazione iper-personalizzata generano incrementi del Customer Lifetime Value tra il 15% e il 25%. Un miglioramento di appena il 5% nella retention si traduce in aumenti di profitto dal 25% al 95%.",
    highlights: [
      { value: "+95%", label: "profitto da retention" },
      { value: "+30%", label: "LTV e-commerce" },
    ],
    sources: [8],
  },
  {
    icon: TrendingUp,
    title: "Impatto sul fatturato",
    stat: "+12%",
    statLabel: "ricavi medi",
    body: "Le imprese che nel 2024 hanno implementato almeno una tecnologia AI registrano ricavi superiori del 12% rispetto a chi non l'ha fatto. I progetti di intelligent automation dimostrano ROI dal 212% al 554% su tre anni, con payback period inferiore ai 6-12 mesi.",
    highlights: [
      { value: "554%", label: "ROI massimo" },
      { value: "<6", label: "mesi di payback" },
    ],
    sources: [9, 10],
  },
];

const REPORT_SOURCES: Record<number, { label: string; detail: string; url: string }> = {
  1: { label: "NBER", detail: "Generative AI at Work, 2023", url: "https://www.nber.org/system/files/working_papers/w31161/w31161.pdf" },
  2: { label: "Reuters / Klarna", detail: "AI Chatbots Impact on Workforce, 2024", url: "https://www.reuters.com/technology/artificial-intelligence/swedens-klarna-says-ai-chatbots-help-shrink-headcount-2024-08-27/" },
  3: { label: "Salesforce", detail: "State of Sales Report, 2026", url: "https://www.salesforce.com/en-us/wp-content/uploads/sites/4/documents/reports/sales/salesforce-state-of-sales-report-2026.pdf" },
  4: { label: "Salesforce Research", detail: "Predictive Lead Scoring Analysis", url: "https://www.salesforce.com/en-us/wp-content/uploads/sites/4/documents/reports/sales/salesforce-state-of-sales-report-2026.pdf" },
  5: { label: "SparkCo AI", detail: "B2B CAC Benchmarks, 2025", url: "https://sparkco.ai/blog/ai-b2b-customer-acquisition-cost-benchmarks-2025" },
  6: { label: "Single Grain", detail: "AI Marketing & CAC Reduction, 2025", url: "https://www.singlegrain.com/customer-acquisition/how-ai-marketing-optimization-reduces-customer-acquisition-costs-in-2025/" },
  7: { label: "Meta Engineering", detail: "Advantage+ Automation, 2024", url: "https://engineering.fb.com/2024/12/02/production-engineering/meta-andromeda-advantage-automation-next-gen-personalized-ads-retrieval-engine/" },
  8: { label: "Genesys Growth", detail: "Customer Acquisition Cost Benchmarks", url: "https://genesysgrowth.com/blog/customer-acquisition-cost-benchmarks-for-marketing-leaders" },
  9: { label: "Istat", detail: "ICT nelle imprese italiane, 2025", url: "https://www.istat.it/wp-content/uploads/2025/12/Statreport_ICT2025.pdf" },
  10: { label: "Forrester TEI", detail: "Intelligent Automation ROI, 2024", url: "https://tei.forrester.com/go/SSCBluePrism/IntelligentAutomation//docs/TEI_Of_SS-C_BluePrism_2024_4_4_PDFversion_FINAL.pdf" },
};

// ── Props ────────────────────────────────────────────

interface PresentationOverlayProps {
  nodes: Node[];
  edges: Edge[];
  totalExternal: number;
  sector: string;
  priceTier: PriceTier;
  allComponents: FlowNode[];
  activeVariableCosts: import("@/data/templates").VariableCost[];
  onClose: () => void;
}

// ── Component ────────────────────────────────────────

export function PresentationOverlay({
  nodes,
  edges,
  totalExternal,
  sector,
  priceTier,
  allComponents,
  activeVariableCosts,
  onClose,
}: PresentationOverlayProps) {
  const [tab, setTab] = useState<"flusso" | "resoconto">("resoconto");
  const [showOffer, setShowOffer] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const competitors = collectUniqueCompetitors(allComponents, priceTier);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
          <motion.div
            key="pitch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Top bar — with tab switcher */}
            <div className="border-b border-border bg-card px-5 py-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <img src="/squadd-logo.svg" alt="Squadd" className="h-8 shrink-0" />
                {sector && (
                  <>
                    <div className="h-4 w-px bg-border" />
                    <span className="font-mono text-3xs text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full">
                      {sector}
                    </span>
                  </>
                )}
              </div>

              {/* Tab switcher */}
              <div className="flex items-center bg-muted/40 rounded-lg p-0.5">
                {(["flusso", "resoconto"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3 py-1 rounded-md font-mono text-2xs font-medium uppercase tracking-wider transition-all ${
                      tab === t
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "flusso" ? "Flusso" : "Resoconto"}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowOffer(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-2xs font-bold uppercase tracking-wider bg-emerald-500 text-white hover:bg-emerald-400 transition-colors"
                >
                  <Presentation className="w-3.5 h-3.5" />
                  Presenta
                </button>
                <button
                  onClick={onClose}
                  className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Tab: Automazione — fullscreen canvas ── */}
            {tab === "flusso" && (
              <div className="flex-1 relative">
                <ReactFlowProvider>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    fitView
                    fitViewOptions={{ padding: 0.15 }}
                    proOptions={{ hideAttribution: true }}
                    panOnScroll={false}
                    zoomOnScroll={false}
                    preventScrolling={false}
                  >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(0 0% 12%)" />
                  </ReactFlow>
                </ReactFlowProvider>
              </div>
            )}

            {/* ── Tab: Resoconto — pitch content ── */}
            {tab === "resoconto" && (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">

                {/* ── Competitors breakdown ── */}
                {competitors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.12 }}
                >
                    <div className="flex flex-col min-w-0">
                      <p className="font-mono text-3xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Cosa sostituisce Squadd
                      </p>
                      <div className="rounded-lg border border-border/40 bg-card overflow-hidden flex-1 flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                          {competitors.map((comp, i) => (
                            <motion.div
                              key={comp.compId}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.15, delay: 0.18 + i * 0.03 }}
                              className={`flex items-center justify-between px-4 py-2.5 font-mono text-2xs ${
                                i % 2 === 0 ? "" : "bg-foreground/[0.02]"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                                {comp.allNames.length > 0 ? (
                                  <div className="flex items-center gap-2.5">
                                    {comp.allNames.map((entry) => (
                                      <div key={entry.name} className="flex items-center gap-1.5">
                                        <img src={entry.logo} alt={entry.name} className="w-5 h-5 object-contain shrink-0" />
                                        <span className="text-foreground/80 font-medium whitespace-nowrap">{entry.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded bg-muted/30 shrink-0" />
                                    <span className="text-foreground/80 font-medium">{comp.name}</span>
                                  </div>
                                )}
                                <span className="text-muted-foreground/35 ml-1 hidden sm:inline">{comp.categoryLabel}</span>
                              </div>
                              <span className="tabular-nums text-muted-foreground/50 shrink-0">
                                &#8364;{comp.cost}/mese
                              </span>
                            </motion.div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-foreground/[0.03] font-mono text-xs mt-auto">
                          <span className="font-bold uppercase tracking-widest text-muted-foreground">Totale</span>
                          <span className="font-bold tabular-nums text-foreground/50">
                            &#8364;{totalExternal}/mese
                          </span>
                        </div>
                      </div>
                    </div>
                </motion.div>
                )}

                {/* ── Report: AI & Automazione ── */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.2 }}
                >
                  <div className="flex items-baseline justify-between mb-4">
                    <h2 className="font-mono text-sm font-bold uppercase tracking-widest">
                      Perch&eacute; AI e automazione
                    </h2>
                    <p className="text-2xs text-muted-foreground/60">
                      Dati verificati da fonti indipendenti
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {REPORT_SECTIONS.map((section, idx) => {
                      const Icon = section.icon;
                      return (
                        <motion.div
                          key={section.title}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: 0.25 + idx * 0.04 }}
                          className="rounded-lg border border-border/30 bg-card p-4 flex flex-col gap-2.5"
                        >
                          {/* Stat — big and bold */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-foreground/[0.06] flex items-center justify-center shrink-0">
                                <Icon className="w-3.5 h-3.5 text-foreground/50" />
                              </div>
                              <div>
                                <h3 className="font-mono text-2xs font-bold uppercase tracking-wider leading-tight" style={{ color: "#c2ff10" }}>{section.title}</h3>
                                <p className="font-mono text-3xs text-muted-foreground/50">{section.statLabel}</p>
                              </div>
                            </div>
                            <span className="font-mono text-2xl font-bold tabular-nums leading-none shrink-0 ml-3" style={{ color: "#c2ff10" }}>
                              {section.stat}
                            </span>
                          </div>

                          {/* Body */}
                          <p className="text-2xs text-foreground/50 leading-relaxed">
                            {section.body}
                          </p>

                          {/* KPI pills */}
                          {(() => {
                            const badgeColors = [
                              { bg: "rgba(0, 212, 255, 0.10)", border: "rgba(0, 212, 255, 0.25)", text: "#00d4ff" },
                              { bg: "rgba(168, 85, 247, 0.10)", border: "rgba(168, 85, 247, 0.25)", text: "#a855f7" },
                              { bg: "rgba(251, 146, 60, 0.10)", border: "rgba(251, 146, 60, 0.25)", text: "#fb923c" },
                              { bg: "rgba(244, 114, 182, 0.10)", border: "rgba(244, 114, 182, 0.25)", text: "#f472b6" },
                              { bg: "rgba(194, 255, 16, 0.10)", border: "rgba(194, 255, 16, 0.25)", text: "#c2ff10" },
                              { bg: "rgba(96, 165, 250, 0.10)", border: "rgba(96, 165, 250, 0.25)", text: "#60a5fa" },
                            ];
                            const color = badgeColors[idx % badgeColors.length];
                            return (
                              <div className="flex flex-wrap gap-1.5">
                                {section.highlights.map((h) => (
                                  <span
                                    key={h.label}
                                    className="inline-flex items-center gap-1 font-mono text-3xs rounded-full px-2.5 py-0.5"
                                    style={{ backgroundColor: color.bg, border: `1px solid ${color.border}` }}
                                  >
                                    <span className="font-bold" style={{ color: color.text }}>{h.value}</span>
                                    <span style={{ color: color.text, opacity: 0.6 }}>{h.label}</span>
                                  </span>
                                ))}
                              </div>
                            );
                          })()}

                          {/* Sources */}
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/15 mt-auto">
                            {section.sources.map((srcId) => {
                              const src = REPORT_SOURCES[srcId];
                              return (
                                <a
                                  key={srcId}
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-3xs text-foreground/40 hover:text-foreground/70 underline underline-offset-2 decoration-foreground/15 hover:decoration-foreground/40 transition-colors"
                                >
                                  {src.label} — {src.detail}
                                </a>
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>


              </div>
            </div>
            )}
          </motion.div>

      {/* Offer overlay — renders on top when green "Presenta" is clicked */}
      {showOffer && (
        <OfferOverlay
          onClose={() => setShowOffer(false)}
          activeVariableCosts={activeVariableCosts}
          totalExternal={totalExternal}
        />
      )}
    </motion.div>
  );
}
