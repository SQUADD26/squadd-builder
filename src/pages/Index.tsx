import { useState, useCallback, useEffect } from "react";
import { useFlowBuilder } from "@/hooks/useFlowBuilder";
import { FlowCanvas } from "@/components/FlowCanvas";
import { BuilderPanel } from "@/components/BuilderPanel";
import { TopBar } from "@/components/TopBar";
import { generateReport } from "@/lib/generatePdf";
import { toast } from "sonner";
import { ReactFlowProvider } from "@xyflow/react";
import { PresentationOverlay } from "@/components/PresentationOverlay";
import { STEP_TEMPLATES, SQUADD_PLANS } from "@/data/templates";
import { FlowData } from "@/data/flowTypes";
import { AnimatePresence, motion } from "motion/react";

function encodeFlowToUrl(flowData: FlowData, sector: string, priceTier: string, plan: string): string {
  const payload = JSON.stringify({ f: flowData, s: sector, t: priceTier, p: plan });
  const encoded = btoa(unescape(encodeURIComponent(payload)));
  return `${window.location.origin}${window.location.pathname}?flow=${encoded}`;
}

function decodeFlowFromUrl(): { flowData: FlowData; sector: string; priceTier: string; plan: string } | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("flow");
    if (!encoded) return null;
    const json = decodeURIComponent(escape(atob(encoded)));
    const data = JSON.parse(json);
    return { flowData: data.f, sector: data.s || "", priceTier: data.t || "budget", plan: data.p || "max" };
  } catch {
    return null;
  }
}

const Index = () => {
  const flow = useFlowBuilder();
  const [insertAfterId, setInsertAfterId] = useState<string | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [sharedMode, setSharedMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Keyboard shortcuts: undo / redo / escape ─────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        flow.undo();
      } else if (mod && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        flow.redo();
      } else if (e.key === "Escape") {
        setInsertAfterId(null);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [flow]);

  // Load shared flow from URL
  useEffect(() => {
    const shared = decodeFlowFromUrl();
    if (shared) {
      flow.loadFlow(shared.flowData);
      flow.setSector(shared.sector);
      flow.setPriceTier(shared.priceTier as "budget" | "premium");
      if (shared.plan === "pro" || shared.plan === "max" || shared.plan === "agency") {
        flow.setSelectedPlan(shared.plan);
      }
      setSharedMode(true);
      // Clean URL without reload
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleInsertAfter = useCallback((afterId: string) => {
    setInsertAfterId(afterId);
    toast.info("Seleziona uno step dal pannello per inserirlo dopo");
  }, []);

  const handleInsertBetween = useCallback((
    connectionId: string,
    type: "action" | "condition" | "parallel" | "smart-condition",
    opts?: { templateId?: string; label?: string; conditionQuestion?: string; branches?: { label: string }[] },
  ) => {
    if (type === "action" && opts?.templateId) {
      const t = STEP_TEMPLATES.find(s => s.id === opts.templateId);
      flow.insertBetween(connectionId, "action", {
        templateId: opts.templateId,
        label: t?.label || "Nuovo step",
        icon: t?.icon,
      });
      toast.success("Step inserito");
    } else if (type === "smart-condition" && opts?.branches) {
      flow.insertSmartCondition(connectionId, opts.branches, opts.conditionQuestion || opts.label);
      toast.success("Ramificazione inserita");
    } else if (type === "condition") {
      flow.insertBetween(connectionId, "condition", {
        label: opts?.label || opts?.conditionQuestion || "Condizione",
        conditionQuestion: opts?.conditionQuestion || opts?.label,
      });
      toast.success("Condizione inserita");
    } else if (type === "parallel") {
      flow.insertBetween(connectionId, "parallel", { label: "Parallelo" });
      toast.success("Parallelo inserito");
    }
  }, [flow]);

  // Consolidated handlers for adding steps/conditions/parallels (to end or after a node)
  const handleAddStepToEnd = useCallback((templateId: string) => {
    flow.addStep(templateId);
    toast.success("Step aggiunto");
  }, [flow]);

  const handleAddConditionToEnd = useCallback((question: string) => {
    flow.addCondition(question);
    toast.success("Condizione aggiunta");
  }, [flow]);

  const handleAddParallelToEnd = useCallback(() => {
    flow.addParallel();
    toast.success("Parallelo aggiunto");
  }, [flow]);

  const handleAddStepAfterNode = useCallback((afterNodeId: string, templateId: string) => {
    flow.addStep(templateId, afterNodeId);
    toast.success("Step aggiunto");
  }, [flow]);

  const handleAddConditionAfterNode = useCallback((afterNodeId: string, question: string) => {
    flow.addCondition(question, afterNodeId);
    toast.success("Condizione aggiunta");
  }, [flow]);

  const handleAddParallelAfterNode = useCallback((afterNodeId: string) => {
    flow.addParallel(afterNodeId);
    toast.success("Parallelo aggiunto");
  }, [flow]);

  const handleAddBranch = useCallback((nodeId: string) => {
    flow.addBranch(nodeId);
    toast.success("Branch aggiunto");
  }, [flow]);

  const handleInsertBeforeNode = useCallback((
    beforeNodeId: string,
    type: "action" | "condition" | "parallel" | "smart-condition",
    opts?: { templateId?: string; label?: string; conditionQuestion?: string; branches?: { label: string }[] },
  ) => {
    if (type === "action" && opts?.templateId) {
      const t = STEP_TEMPLATES.find(s => s.id === opts.templateId);
      flow.insertBefore(beforeNodeId, "action", { templateId: opts.templateId, label: t?.label || "Nuovo step", icon: t?.icon });
    } else if (type === "smart-condition") {
      flow.insertBefore(beforeNodeId, "smart-condition", { label: opts?.label || "Ramificazione", conditionQuestion: opts?.conditionQuestion, branches: opts?.branches });
    } else if (type === "condition") {
      flow.insertBefore(beforeNodeId, "condition", { label: opts?.label || "Condizione", conditionQuestion: opts?.conditionQuestion || opts?.label });
    } else if (type === "parallel") {
      flow.insertBefore(beforeNodeId, "parallel", { label: "Parallelo" });
    }
    toast.success("Step inserito");
  }, [flow]);

  const handleBranchFromNode = useCallback((
    fromNodeId: string,
    type: "action" | "condition" | "parallel" | "smart-condition",
    opts?: { templateId?: string; label?: string; conditionQuestion?: string; branches?: { label: string }[] },
    direction?: "right" | "left" | "top" | "bottom",
    sourceHandle?: string,
  ) => {
    if (type === "action" && opts?.templateId) {
      const t = STEP_TEMPLATES.find(s => s.id === opts.templateId);
      flow.branchFromNode(fromNodeId, "action", { templateId: opts.templateId, label: t?.label || "Nuovo step", icon: t?.icon }, direction, sourceHandle);
    } else if (type === "smart-condition") {
      flow.branchFromNode(fromNodeId, "smart-condition", { label: opts?.label || "Ramificazione", conditionQuestion: opts?.conditionQuestion, branches: opts?.branches }, direction, sourceHandle);
    } else if (type === "condition") {
      flow.branchFromNode(fromNodeId, "condition", { label: opts?.label || "Condizione", conditionQuestion: opts?.conditionQuestion || opts?.label }, direction, sourceHandle);
    } else if (type === "parallel") {
      flow.branchFromNode(fromNodeId, "parallel", { label: "Parallelo" }, direction, sourceHandle);
    }
    toast.success("Nodo aggiunto");
  }, [flow]);

  const handleUpdateConnectionLabel = useCallback((connectionId: string, label: string | undefined) => {
    flow.updateConnectionLabel(connectionId, label);
    toast.success(label ? "Etichetta aggiornata" : "Etichetta rimossa");
  }, [flow]);

  const handleInsertSmartCondition = useCallback((connectionId: string, branches: { label: string }[], conditionLabel?: string) => {
    flow.insertSmartCondition(connectionId, branches, conditionLabel);
    toast.success("Smart condition inserita");
  }, [flow]);

  const handleForkParallelSibling = useCallback((
    siblingNodeId: string,
    type: "action" | "condition" | "parallel" | "smart-condition",
    opts?: { templateId?: string; label?: string; conditionQuestion?: string; branches?: { label: string }[] },
  ) => {
    if (type === "action" && opts?.templateId) {
      const t = STEP_TEMPLATES.find(s => s.id === opts.templateId);
      flow.forkSibling(siblingNodeId, "action", { templateId: opts.templateId, label: t?.label || "Nuovo step", icon: t?.icon });
    } else if (type === "smart-condition") {
      flow.forkSibling(siblingNodeId, "smart-condition", { label: opts?.label || "Ramificazione", conditionQuestion: opts?.conditionQuestion, branches: opts?.branches });
    } else if (type === "condition") {
      flow.forkSibling(siblingNodeId, "condition", { label: opts?.label || "Condizione", conditionQuestion: opts?.conditionQuestion || opts?.label });
    } else if (type === "parallel") {
      flow.forkSibling(siblingNodeId, "parallel", { label: "Parallelo" });
    }
    toast.success("Diramazione creata");
  }, [flow]);

  const handleExportPdf = async () => {
    generateReport({
      flowData: flow.flowData,
      sector: flow.sector,
      totalExternal: flow.totalExternal,
      savings: flow.savings,
      priceTier: flow.priceTier,
      selectedPlan: flow.selectedPlan,
      effectivePrice: flow.effectivePrice,
      activeVariableCosts: flow.activeVariableCosts,
    });
    toast.success("PDF scaricato");
  };

  const handleShare = () => {
    const url = encodeFlowToUrl(flow.flowData, flow.sector, flow.priceTier, flow.selectedPlan);
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copiato negli appunti"),
      () => toast.error("Impossibile copiare il link")
    );
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar
        onPresent={() => setPresenting(true)}
        onShare={handleShare}
        hasFlow={flow.flowData.nodes.length > 0}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onUndo={flow.undo}
        onRedo={flow.redo}
        canUndo={flow.canUndo}
        canRedo={flow.canRedo}
        lastSaved={flow.lastSaved}
      />
      <div className="flex flex-1 overflow-hidden">
        <ReactFlowProvider>
          <FlowCanvas
            nodes={flow.nodes}
            edges={flow.edges}
            onRemoveStep={flow.removeStep}
            onRemoveSource={flow.removeSource}
            onInsertAfter={handleInsertAfter}
            onInsertBetween={handleInsertBetween}
            onAddStepAfterNode={handleAddStepAfterNode}
            onAddConditionAfterNode={handleAddConditionAfterNode}
            onAddParallelAfterNode={handleAddParallelAfterNode}
            onAddStepToEnd={handleAddStepToEnd}
            onAddConditionToEnd={handleAddConditionToEnd}
            onAddParallelToEnd={handleAddParallelToEnd}
            onAddBranch={handleAddBranch}
            onInsertBeforeNode={handleInsertBeforeNode}
            onForkParallelSibling={handleForkParallelSibling}
            onBranchFromNode={handleBranchFromNode}
            onUpdateConnectionLabel={handleUpdateConnectionLabel}
            onInsertSmartCondition={handleInsertSmartCondition}
            onNodePositionChange={flow.updateNodePosition}
            onCanvasClick={() => setInsertAfterId(null)}
          />
        </ReactFlowProvider>
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              key="builder-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden shrink-0"
            >
              <BuilderPanel
                flowData={flow.flowData}
                highlightedTemplates={flow.highlightedTemplates}
                totalExternal={flow.totalExternal}
                savings={flow.savings}
                priceTier={flow.priceTier}
                effectivePrice={flow.effectivePrice}
                selectedPlan={flow.selectedPlan}
                onAddStep={flow.addStep}
                onRemoveStep={flow.removeStep}
                onReset={flow.reset}
                insertAfterId={insertAfterId}
                onClearInsertAfter={() => setInsertAfterId(null)}
                onExportPdf={handleExportPdf}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Presentation mode overlay */}
      {presenting && (
        <PresentationOverlay
          nodes={flow.nodes}
          edges={flow.edges}
          totalExternal={flow.totalExternal}
          sector={flow.sector}
          priceTier={flow.priceTier}
          allComponents={flow.allComponents}
          activeVariableCosts={flow.activeVariableCosts}
          onClose={() => setPresenting(false)}
        />
      )}
    </div>
  );
};

export default Index;
