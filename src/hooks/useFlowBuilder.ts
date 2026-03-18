import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { FlowData, FlowNode, createEmptyFlow } from "@/data/flowTypes";
import { loadAndMigrate } from "@/data/migration";
import {
  addSource as opAddSource,
  removeSource as opRemoveSource,
  addStepToEnd,
  addStepToBranch,
  removeAndReconnect,
  updateNode,
  insertBetween as opInsertBetween,
  updateConnectionLabel as opUpdateConnectionLabel,
  insertSmartCondition as opInsertSmartCondition,
  insertAfterNode,
  insertBeforeNode,
  forkParallelSibling,
  addBranchFromNode,
  addBranch as opAddBranch,
  removeBranch as opRemoveBranch,
  renameBranch as opRenameBranch,
  addNode,
  addConnection as opAddConnection,
  removeConnection as opRemoveConnection,
} from "@/hooks/useFlowOperations";
import { layoutFlow, type LayoutCallbacks } from "@/hooks/useFlowLayout";
import {
  SOURCE_TEMPLATES, STEP_TEMPLATES, SQUADD_PRICE,
  getCompetitorCost, type PriceTier,
  type SquaddPlanId, getEffectivePlanPrice,
  flowHasWhatsApp as checkFlowHasWhatsApp,
  getActiveVariableCosts, type VariableCost,
} from "@/data/templates";
import type { Node, Edge } from "@xyflow/react";

const STORAGE_KEY = "squadd-flow-v2";
const TIER_KEY = "squadd-price-tier";
const PLAN_KEY = "squadd-plan";

function loadFlowFromStorage(): FlowData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return loadAndMigrate(JSON.parse(raw));
  } catch { /* empty */ }
  return createEmptyFlow();
}

function saveFlow(flow: FlowData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flow));
}

function loadTier(): PriceTier {
  try {
    const raw = localStorage.getItem(TIER_KEY);
    if (raw === "budget" || raw === "premium") return raw;
  } catch { /* empty */ }
  return "budget";
}

function loadPlan(): SquaddPlanId {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (raw === "pro" || raw === "max" || raw === "agency") return raw;
  } catch { /* empty */ }
  return "max";
}

// Collect unique competitorIds from all nodes
function collectCompetitorIds(nodes: FlowNode[]): Set<string> {
  const competitorIds = new Set<string>();
  for (const n of nodes) {
    if (!n.templateId) continue;
    const srcT = SOURCE_TEMPLATES.find(t => t.id === n.templateId);
    if (srcT?.competitorId) { competitorIds.add(srcT.competitorId); continue; }
    const stepT = STEP_TEMPLATES.find(t => t.id === n.templateId);
    if (stepT?.competitorId) { competitorIds.add(stepT.competitorId); }
  }
  return competitorIds;
}

function calcCost(nodes: FlowNode[], tier: PriceTier): number {
  const competitorIds = collectCompetitorIds(nodes);
  // Automations are always implicit when the flow has any steps
  if (nodes.length > 0) competitorIds.add("automazione");
  let total = 0;
  for (const cid of competitorIds) {
    total += getCompetitorCost(cid, tier);
  }
  return total;
}

const MAX_HISTORY = 30;

export function useFlowBuilder() {
  const [flowData, setFlowData] = useState<FlowData>(loadFlowFromStorage);
  const [sector, setSector] = useState(() => {
    try {
      return localStorage.getItem("squadd-sector") || "";
    } catch { return ""; }
  });
  const [highlightedTemplates, setHighlightedTemplates] = useState<string[]>([]);
  const [priceTier, setPriceTier] = useState<PriceTier>(loadTier);
  const [selectedPlan, setSelectedPlan] = useState<SquaddPlanId>(loadPlan);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // ── Undo / Redo history ─────────────────────────────
  const historyRef = useRef<{ past: FlowData[]; future: FlowData[] }>({ past: [], future: [] });
  const [, forceUpdate] = useState(0); // trigger re-render when history changes

  const pushState = useCallback((newFlow: FlowData) => {
    setFlowData(prev => {
      historyRef.current.past = [...historyRef.current.past.slice(-(MAX_HISTORY - 1)), prev];
      historyRef.current.future = [];
      forceUpdate(c => c + 1);
      return newFlow;
    });
  }, []);

  /** Wrap a setFlowData updater so that the previous state is saved to history. */
  const updateFlow = useCallback((updater: (prev: FlowData) => FlowData) => {
    setFlowData(prev => {
      const next = updater(prev);
      if (next === prev) return prev; // no-op, skip history
      historyRef.current.past = [...historyRef.current.past.slice(-(MAX_HISTORY - 1)), prev];
      historyRef.current.future = [];
      forceUpdate(c => c + 1);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    historyRef.current.past = past.slice(0, -1);
    setFlowData(current => {
      historyRef.current.future = [current, ...future];
      forceUpdate(c => c + 1);
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (future.length === 0) return;
    const next = future[0];
    historyRef.current.future = future.slice(1);
    setFlowData(current => {
      historyRef.current.past = [...past, current];
      forceUpdate(c => c + 1);
      return next;
    });
  }, []);

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  useEffect(() => { saveFlow(flowData); setLastSaved(new Date()); }, [flowData]);
  useEffect(() => { localStorage.setItem("squadd-sector", sector); }, [sector]);
  useEffect(() => { localStorage.setItem(TIER_KEY, priceTier); }, [priceTier]);
  useEffect(() => { localStorage.setItem(PLAN_KEY, selectedPlan); }, [selectedPlan]);

  // ── Source operations ─────────────────────────────────

  const addSource = useCallback((templateId: string) => {
    const t = SOURCE_TEMPLATES.find(s => s.id === templateId);
    if (!t) return;
    updateFlow(prev => opAddSource(prev, templateId, t.label, t.icon));
  }, [updateFlow]);

  const removeSource = useCallback((id: string) => {
    updateFlow(prev => opRemoveSource(prev, id));
  }, [updateFlow]);

  // ── Step operations ───────────────────────────────────

  const addStep = useCallback((
    templateId: string,
    afterId?: string,
    branch?: string,
  ) => {
    const t = STEP_TEMPLATES.find(s => s.id === templateId);
    if (!t) return;
    const opts = { templateId, label: t.label, icon: t.icon };

    updateFlow(prev => {
      if (afterId && branch) {
        return addStepToBranch(prev, afterId, branch, "action", opts).flow;
      }
      if (afterId) {
        return insertAfterNode(prev, afterId, "action", opts);
      }
      return addStepToEnd(prev, "action", opts).flow;
    });
  }, [updateFlow]);

  const addCondition = useCallback((question: string, afterId?: string, branch?: string) => {
    const opts = { label: question, conditionQuestion: question };

    updateFlow(prev => {
      if (afterId && branch) {
        return addStepToBranch(prev, afterId, branch, "condition", opts).flow;
      }
      if (afterId) {
        return insertAfterNode(prev, afterId, "condition", opts);
      }
      return addStepToEnd(prev, "condition", opts).flow;
    });
  }, [updateFlow]);

  const addParallel = useCallback((afterId?: string, branch?: string) => {
    const opts = { label: "Parallelo" };
    updateFlow(prev => {
      if (afterId && branch) {
        return addStepToBranch(prev, afterId, branch, "parallel", opts).flow;
      }
      if (afterId) {
        return insertAfterNode(prev, afterId, "parallel", opts);
      }
      return addStepToEnd(prev, "parallel", opts).flow;
    });
  }, [updateFlow]);

  const insertBefore = useCallback((
    beforeNodeId: string,
    type: FlowNode["type"],
    opts?: { templateId?: string; label?: string; icon?: string; conditionQuestion?: string; branches?: { label: string }[] },
  ) => {
    updateFlow(prev => insertBeforeNode(prev, beforeNodeId, type, opts));
  }, [updateFlow]);

  const forkSibling = useCallback((
    siblingNodeId: string,
    type: FlowNode["type"],
    opts?: { templateId?: string; label?: string; icon?: string; conditionQuestion?: string; branches?: { label: string }[] },
  ) => {
    updateFlow(prev => forkParallelSibling(prev, siblingNodeId, type, opts));
  }, [updateFlow]);

  const branchFromNode = useCallback((
    fromNodeId: string,
    type: FlowNode["type"],
    opts?: { templateId?: string; label?: string; icon?: string; conditionQuestion?: string; branches?: { label: string }[] },
    direction?: "right" | "left" | "top" | "bottom",
    sourceHandle?: string,
  ) => {
    updateFlow(prev => addBranchFromNode(prev, fromNodeId, type, opts, direction, sourceHandle));
  }, [updateFlow]);

  const removeStep = useCallback((id: string) => {
    updateFlow(prev => removeAndReconnect(prev, id));
  }, [updateFlow]);

  const updateNote = useCallback((id: string, note: string) => {
    updateFlow(prev => {
      const node = prev.nodes.find(n => n.id === id);
      if (!node) return prev;
      if (node.type === "condition") {
        return updateNode(prev, id, { label: note, conditionQuestion: note });
      }
      return updateNode(prev, id, { note });
    });
  }, [updateFlow]);

  // ── New DAG operations ────────────────────────────────

  const insertBetween = useCallback((connectionId: string, type: FlowNode["type"], opts?: { templateId?: string; label?: string; icon?: string; conditionQuestion?: string; branches?: { label: string }[] }) => {
    updateFlow(prev => {
      const result = opInsertBetween(prev, connectionId, type, opts);
      return result ? result.flow : prev;
    });
  }, [updateFlow]);

  const addBranch = useCallback((condNodeId: string, label?: string) => {
    updateFlow(prev => opAddBranch(prev, condNodeId, label).flow);
  }, [updateFlow]);

  const removeBranch = useCallback((condNodeId: string, branchId: string) => {
    updateFlow(prev => opRemoveBranch(prev, condNodeId, branchId));
  }, [updateFlow]);

  const renameBranch = useCallback((condNodeId: string, branchId: string, label: string) => {
    updateFlow(prev => opRenameBranch(prev, condNodeId, branchId, label));
  }, [updateFlow]);

  const addConnectionOp = useCallback((sourceId: string, targetId: string, sourceHandle?: string) => {
    updateFlow(prev => {
      const result = opAddConnection(prev, sourceId, targetId, sourceHandle);
      return result ? result.flow : prev;
    });
  }, [updateFlow]);

  const removeConnectionOp = useCallback((connectionId: string) => {
    updateFlow(prev => opRemoveConnection(prev, connectionId));
  }, [updateFlow]);

  const updateConnectionLabel = useCallback((connectionId: string, label: string | undefined) => {
    updateFlow(prev => opUpdateConnectionLabel(prev, connectionId, label));
  }, [updateFlow]);

  const insertSmartCondition = useCallback((connectionId: string, branches: { label: string }[], conditionLabel?: string) => {
    updateFlow(prev => {
      const result = opInsertSmartCondition(prev, connectionId, branches, conditionLabel);
      return result ? result.flow : prev;
    });
  }, [updateFlow]);

  // ── General ───────────────────────────────────────────

  const loadFlow = useCallback((data: unknown) => {
    pushState(loadAndMigrate(data));
  }, [pushState]);

  const reset = useCallback(() => {
    positionsRef.current = {};
    pushState(createEmptyFlow());
    setSector("");
    setHighlightedTemplates([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("squadd-sector");
  }, [pushState]);

  // ── Computed ──────────────────────────────────────────

  const totalExternal = calcCost(flowData.nodes, priceTier);
  const hasWhatsApp = useMemo(() => checkFlowHasWhatsApp(flowData.nodes), [flowData]);
  const effectivePrice = useMemo(() => getEffectivePlanPrice(selectedPlan, hasWhatsApp), [selectedPlan, hasWhatsApp]);
  const savings = Math.max(0, totalExternal - effectivePrice);
  const activeVariableCosts = useMemo(() => getActiveVariableCosts(flowData.nodes), [flowData]);

  const allComponents = useMemo(() => {
    return flowData.nodes.filter(n => n.type === "source" || n.type === "action");
  }, [flowData]);

  // Toggle source: add if not present, remove if present
  const toggleSource = useCallback((templateId: string) => {
    const existing = flowData.nodes.find(n => n.type === "source" && n.templateId === templateId);
    if (existing) {
      removeSource(existing.id);
    } else {
      addSource(templateId);
    }
  }, [flowData.nodes, addSource, removeSource]);

  const callbacks: LayoutCallbacks = useMemo(() => ({
    onUpdateNote: updateNote,
    onSelectSource: toggleSource,
  }), [updateNote, toggleSource]);

  // Track existing node positions so layout is incremental (existing nodes don't move)
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({});

  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    positionsRef.current[nodeId] = position;
  }, []);

  const { nodes, edges } = useMemo(() => {
    const result = layoutFlow(flowData, callbacks, priceTier, positionsRef.current);
    // Save positions for next layout pass
    const newPositions: Record<string, { x: number; y: number }> = {};
    for (const node of result.nodes) {
      newPositions[node.id] = { x: node.position.x, y: node.position.y };
    }
    positionsRef.current = newPositions;
    return result;
  }, [flowData, callbacks, priceTier]);

  return {
    flowData,
    nodes,
    edges,
    sector,
    setSector,
    highlightedTemplates,
    setHighlightedTemplates,
    priceTier,
    setPriceTier,
    loadFlow,
    addSource,
    removeSource,
    addStep,
    addCondition,
    addParallel,
    insertBefore,
    forkSibling,
    branchFromNode,
    removeStep,
    updateNote,
    insertBetween,
    addBranch,
    removeBranch,
    renameBranch,
    addConnection: addConnectionOp,
    removeConnection: removeConnectionOp,
    updateConnectionLabel,
    insertSmartCondition,
    reset,
    undo,
    redo,
    canUndo,
    canRedo,
    lastSaved,
    totalExternal,
    savings,
    allComponents,
    selectedPlan,
    setSelectedPlan,
    effectivePrice,
    flowHasWhatsApp: hasWhatsApp,
    activeVariableCosts,
    updateNodePosition,
  };
}
