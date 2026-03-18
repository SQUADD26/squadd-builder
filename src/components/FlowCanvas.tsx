import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useOnSelectionChange,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { SourceNode } from "@/components/flow/SourceNode";
import { ActionNode } from "@/components/flow/ActionNode";
import { ConditionNode } from "@/components/flow/ConditionNode";
import { ConvergeNode } from "@/components/flow/ConvergeNode";
import { ParallelNode } from "@/components/flow/ParallelNode";
import { SmartConditionNode } from "@/components/flow/SmartConditionNode";
import { TriggerNode } from "@/components/flow/TriggerNode";
import { InsertableEdge } from "@/components/flow/InsertableEdge";
import { StepPickerContent } from "@/components/flow/StepPickerContent";
import { DirectionalPickerContent } from "@/components/flow/DirectionalPickerContent";
import { EdgeActionPopover } from "@/components/flow/EdgeConfigPanel";
import type { AddDirection } from "@/components/flow/NodeAddHandles";
import { GitBranch, Pencil, Trash2, PlusCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AnimatePresence, motion } from "motion/react";
import type { Node, Edge, NodeChange } from "@xyflow/react";

const nodeTypes = {
  sourceNode: SourceNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  convergeNode: ConvergeNode,
  parallelNode: ParallelNode,
  smartConditionNode: SmartConditionNode,
  triggerNode: TriggerNode,
};

const edgeTypes = {
  insertable: InsertableEdge,
};

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  nodeId: string;
  nodeType: string;
}

interface PaneMenuState {
  visible: boolean;
  x: number;
  y: number;
}

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onRemoveStep?: (id: string) => void;
  onRemoveSource?: (id: string) => void;
  onInsertAfter?: (afterId: string) => void;
  onInsertBetween?: (connectionId: string, type: "action" | "condition" | "parallel" | "smart-condition", opts?: { templateId?: string; label?: string; conditionQuestion?: string; branches?: { label: string }[] }) => void;
  onAddStepAfterNode?: (afterNodeId: string, templateId: string) => void;
  onAddConditionAfterNode?: (afterNodeId: string, question: string) => void;
  onAddParallelAfterNode?: (afterNodeId: string) => void;
  onAddStepToEnd?: (templateId: string) => void;
  onAddConditionToEnd?: (question: string) => void;
  onAddParallelToEnd?: () => void;
  onAddBranch?: (nodeId: string) => void;
  onInsertBeforeNode?: (beforeNodeId: string, type: "action" | "condition" | "parallel" | "smart-condition", opts?: { templateId?: string; label?: string; conditionQuestion?: string; branches?: { label: string }[] }) => void;
  onForkParallelSibling?: (siblingNodeId: string, type: "action" | "condition" | "parallel" | "smart-condition", opts?: { templateId?: string; label?: string; conditionQuestion?: string; branches?: { label: string }[] }) => void;
  onBranchFromNode?: (fromNodeId: string, type: "action" | "condition" | "parallel" | "smart-condition", opts?: { templateId?: string; label?: string; conditionQuestion?: string; branches?: { label: string }[] }, direction?: "top" | "bottom" | "right", sourceHandle?: string) => void;
  onCanvasClick?: () => void;
  onUpdateConnectionLabel?: (connectionId: string, label: string | undefined) => void;
  onInsertSmartCondition?: (connectionId: string, branches: { label: string }[], conditionLabel?: string) => void;
  onNodePositionChange?: (nodeId: string, position: { x: number; y: number }) => void;
}

/** Trigger the inline edit UI on a node by clicking its edit button via DOM query. */
function triggerNodeEdit(nodeId: string): void {
  const nodeEl = document.querySelector(`[data-id="${nodeId}"]`);
  if (!nodeEl) return;
  const pencilBtn = nodeEl.querySelector("button.nodrag");
  if (pencilBtn) {
    (pencilBtn as HTMLElement).click();
  } else {
    const noteArea = nodeEl.querySelector(".nodrag");
    if (noteArea) (noteArea as HTMLElement).click();
  }
}

/** Delete a node, choosing the right handler based on node type. */
function deleteNode(
  nodeId: string,
  nodeType: string,
  onRemoveSource?: (id: string) => void,
  onRemoveStep?: (id: string) => void,
): void {
  if (nodeType === "sourceNode" || nodeType === "source") {
    onRemoveSource?.(nodeId);
  } else {
    onRemoveStep?.(nodeId);
  }
}

export function FlowCanvas({
  nodes,
  edges,
  onRemoveStep,
  onRemoveSource,
  onInsertAfter,
  onInsertBetween,
  onAddStepAfterNode,
  onAddConditionAfterNode,
  onAddParallelAfterNode,
  onAddStepToEnd,
  onAddConditionToEnd,
  onAddParallelToEnd,
  onAddBranch,
  onInsertBeforeNode,
  onForkParallelSibling,
  onBranchFromNode,
  onCanvasClick,
  onUpdateConnectionLabel,
  onInsertSmartCondition,
  onNodePositionChange,
}: FlowCanvasProps) {
  const defaultViewport = useMemo(() => ({ x: 40, y: 300, zoom: 0.85 }), []);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, nodeId: "", nodeType: "",
  });
  const [paneMenu, setPaneMenu] = useState<PaneMenuState>({
    visible: false, x: 0, y: 0,
  });
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [edgePickerState, setEdgePickerState] = useState<{
    connectionId: string;
    x: number;
    y: number;
  } | null>(null);
  const [directionalPickerState, setDirectionalPickerState] = useState<{
    nodeId: string;
    direction: AddDirection;
    x: number;
    y: number;
    sourceHandle?: string;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    nodeId: string;
    nodeType: string;
    label: string;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Track selected nodes for toolbar
  useOnSelectionChange({
    onChange: ({ nodes: selected }) => {
      setSelectedNodes(new Set(selected.map(n => n.id)));
    },
  });

  // Close context menu on click outside
  useEffect(() => {
    const handler = () => {
      setContextMenu(prev => ({ ...prev, visible: false }));
      setPaneMenu(prev => ({ ...prev, visible: false }));
    };
    if (contextMenu.visible || paneMenu.visible) {
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }
  }, [contextMenu.visible, paneMenu.visible]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    if (node.id === "__converge") return;
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      nodeType: node.type || "",
    });
    setPaneMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setPaneMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
    });
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // Handle edge "+" click
  const handleEdgeInsertClick = useCallback((connectionId: string, x: number, y: number) => {
    setEdgePickerState({ connectionId, x, y });
  }, []);

  // Handle directional "+" click on nodes
  const handleDirectionalAdd = useCallback((nodeId: string, direction: AddDirection, x: number, y: number) => {
    setDirectionalPickerState({ nodeId, direction, x, y });
  }, []);

  // Handle branch-specific "+" click (for smart-condition branches)
  const handleBranchAdd = useCallback((nodeId: string, branchId: string, x: number, y: number) => {
    setDirectionalPickerState({ nodeId, direction: "right", x, y, sourceHandle: branchId });
  }, []);

  // Inject onInsertClick callback into edges
  const edgesWithCallbacks = useMemo(() => {
    return edges.map(e => ({
      ...e,
      data: {
        ...e.data,
        onInsertClick: handleEdgeInsertClick,
      },
    }));
  }, [edges, handleEdgeInsertClick]);

  /**
   * Resolve the correct insertion strategy for a node:
   * If the node has a single outgoing edge (main chain), insert between.
   * Otherwise, append after the node or at the end.
   */
  const resolveInsert = useCallback((
    nodeId: string,
    type: "action" | "condition" | "parallel" | "smart-condition",
    opts?: { templateId?: string; label?: string; conditionQuestion?: string; branches?: { label: string }[] },
    sourceHandle?: string,
  ) => {
    // If a specific branch handle is provided, find that branch's edge
    const outEdge = sourceHandle
      ? edges.find(e => e.source === nodeId && e.sourceHandle === sourceHandle)
      : edges.find(e => e.source === nodeId && !e.sourceHandle);

    // Smart-condition: use dedicated handler if inserting between
    if (type === "smart-condition" && outEdge && onInsertSmartCondition && opts?.branches) {
      onInsertSmartCondition(outEdge.data?.connectionId || outEdge.id, opts.branches, opts.conditionQuestion);
      return;
    }

    if (outEdge && onInsertBetween) {
      onInsertBetween(outEdge.data?.connectionId || outEdge.id, type, opts);
      return;
    }
    // Fallback: type-specific "after node" or "to end"
    if (type === "smart-condition" && opts?.branches) {
      // Smart-condition without an outgoing edge: create via branchFromNode
      onBranchFromNode?.(nodeId, "smart-condition", opts, "right", sourceHandle);
    } else if (sourceHandle) {
      // Branch-specific add with no existing edge on that branch — create connection from branch
      onBranchFromNode?.(nodeId, type, opts, "right", sourceHandle);
    } else if (type === "action" && opts?.templateId) {
      if (onAddStepAfterNode) onAddStepAfterNode(nodeId, opts.templateId);
      else onAddStepToEnd?.(opts.templateId);
    } else if (type === "condition") {
      const question = opts?.conditionQuestion || opts?.label || "";
      if (onAddConditionAfterNode) onAddConditionAfterNode(nodeId, question);
      else onAddConditionToEnd?.(question);
    } else if (type === "parallel") {
      if (onAddParallelAfterNode) onAddParallelAfterNode(nodeId);
      else onAddParallelToEnd?.();
    }
  }, [edges, onInsertBetween, onInsertSmartCondition, onBranchFromNode, onAddStepAfterNode, onAddConditionAfterNode, onAddParallelAfterNode, onAddStepToEnd, onAddConditionToEnd, onAddParallelToEnd]);

  // Inject toolbar callbacks into nodes
  const nodesWithCallbacks = useMemo(() => {
    return nodes.map(n => ({
      ...n,
      selected: selectedNodes.has(n.id),
      data: {
        ...n.data,
        isSelected: selectedNodes.has(n.id),
        onToolbarAddAfter: (nodeId: string, templateId: string) => {
          resolveInsert(nodeId, "action", { templateId });
        },
        onToolbarAddConditionAfter: (nodeId: string, question: string) => {
          resolveInsert(nodeId, "condition", { label: question, conditionQuestion: question });
        },
        onToolbarAddParallelAfter: (nodeId: string) => {
          resolveInsert(nodeId, "parallel");
        },
        onToolbarEdit: triggerNodeEdit,
        onToolbarDelete: (nodeId: string) => {
          const node = nodes.find(nn => nn.id === nodeId);
          setPendingDelete({
            nodeId,
            nodeType: node?.type || "",
            label: (node?.data as Record<string, unknown>)?.label as string || "questo nodo",
          });
        },
        onToolbarAddBranch: (nodeId: string) => {
          onAddBranch?.(nodeId);
        },
        onDirectionalAdd: handleDirectionalAdd,
        onBranchAdd: handleBranchAdd,
      },
    }));
  }, [nodes, selectedNodes, resolveInsert, onRemoveStep, onRemoveSource, onAddBranch, handleDirectionalAdd, handleBranchAdd]);

  // ── Local node state for free drag support ──
  const draggedRef = useRef<Record<string, { x: number; y: number }>>({});
  const [localNodes, setLocalNodes] = useState<Node[]>([]);

  useEffect(() => {
    const currentIds = new Set(nodesWithCallbacks.map(n => n.id));
    for (const id of Object.keys(draggedRef.current)) {
      if (!currentIds.has(id)) delete draggedRef.current[id];
    }
    setLocalNodes(
      nodesWithCallbacks.map(n => {
        const pos = draggedRef.current[n.id];
        return pos ? { ...n, position: pos } : n;
      })
    );
  }, [nodesWithCallbacks]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setLocalNodes(nds => applyNodeChanges(changes, nds));
  }, []);

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    draggedRef.current[node.id] = node.position;
    onNodePositionChange?.(node.id, node.position);
  }, [onNodePositionChange]);

  return (
    <div className="flex-1 h-full relative">
      <ReactFlow
        nodes={localNodes}
        edges={edgesWithCallbacks}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={defaultViewport}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        fitView={nodes.length > 0}
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        panOnScroll
        zoomOnScroll
        zoomActivationKeyCode="Meta"
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={() => {
          closeContextMenu();
          setPaneMenu(prev => ({ ...prev, visible: false }));
          setEdgePickerState(null);
          setDirectionalPickerState(null);
          onCanvasClick?.();
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(0 0% 12%)" />
        <Controls showInteractive={false} className="!bg-card !border-border !shadow-sm" />
        {nodes.length > 8 && (
          <MiniMap
            nodeStrokeColor="hsl(var(--muted-foreground))"
            nodeColor="hsl(var(--card))"
            className="!bg-card !border-border"
          />
        )}
      </ReactFlow>

      {/* Edge "+" picker — shows EdgeActionPopover (Attesa/Condizione/Step pills) */}
      {edgePickerState && (
        <FloatingPopover
          x={edgePickerState.x}
          y={edgePickerState.y}
          onClose={() => setEdgePickerState(null)}
        >
          <EdgeActionPopover
            onConfirmWait={(label) => {
              onUpdateConnectionLabel?.(edgePickerState.connectionId, label);
              setEdgePickerState(null);
            }}
            onConfirmCondition={(branches, conditionLabel) => {
              onInsertSmartCondition?.(edgePickerState.connectionId, branches, conditionLabel);
              setEdgePickerState(null);
            }}
            onSelectTemplate={(templateId) => {
              onInsertBetween?.(edgePickerState.connectionId, "action", { templateId });
              setEdgePickerState(null);
            }}
            onSelectCondition={(question) => {
              onInsertBetween?.(edgePickerState.connectionId, "condition", { label: question, conditionQuestion: question });
              setEdgePickerState(null);
            }}
            onSelectParallel={() => {
              onInsertBetween?.(edgePickerState.connectionId, "parallel");
              setEdgePickerState(null);
            }}
            onCancel={() => setEdgePickerState(null)}
          />
        </FloatingPopover>
      )}

      {/* Pane context menu — shows StepPickerContent */}
      {paneMenu.visible && (
        <FloatingPopover
          x={paneMenu.x}
          y={paneMenu.y}
          onClose={() => setPaneMenu(prev => ({ ...prev, visible: false }))}
        >
          <StepPickerContent
            onSelectTemplate={(templateId) => { onAddStepToEnd?.(templateId); setPaneMenu(prev => ({ ...prev, visible: false })); }}
            onSelectCondition={(question) => { onAddConditionToEnd?.(question); setPaneMenu(prev => ({ ...prev, visible: false })); }}
            onSelectParallel={() => { onAddParallelToEnd?.(); setPaneMenu(prev => ({ ...prev, visible: false })); }}
          />
        </FloatingPopover>
      )}

      {/* Directional add picker (from node "+" buttons) — two-step: type first, then details */}
      {directionalPickerState && (
        <FloatingPopover
          x={directionalPickerState.x}
          y={directionalPickerState.y}
          onClose={() => setDirectionalPickerState(null)}
        >
          <DirectionalPickerContent
            direction={directionalPickerState.direction}
            onSelectTemplate={(templateId) => {
              const { nodeId, direction, sourceHandle } = directionalPickerState;
              if (direction === "left") {
                onInsertBeforeNode?.(nodeId, "action", { templateId });
              } else if (direction === "top" || direction === "bottom") {
                onBranchFromNode?.(nodeId, "action", { templateId }, direction);
              } else {
                resolveInsert(nodeId, "action", { templateId }, sourceHandle);
              }
              setDirectionalPickerState(null);
            }}
            onSelectCondition={(question) => {
              const { nodeId, direction, sourceHandle } = directionalPickerState;
              const opts = { label: question, conditionQuestion: question };
              if (direction === "left") {
                onInsertBeforeNode?.(nodeId, "condition", opts);
              } else if (direction === "top" || direction === "bottom") {
                onBranchFromNode?.(nodeId, "condition", opts, direction);
              } else {
                resolveInsert(nodeId, "condition", opts, sourceHandle);
              }
              setDirectionalPickerState(null);
            }}
            onSelectParallel={() => {
              const { nodeId, direction, sourceHandle } = directionalPickerState;
              if (direction === "left") {
                onInsertBeforeNode?.(nodeId, "parallel");
              } else if (direction === "top" || direction === "bottom") {
                onBranchFromNode?.(nodeId, "parallel", undefined, direction);
              } else {
                resolveInsert(nodeId, "parallel", undefined, sourceHandle);
              }
              setDirectionalPickerState(null);
            }}
            onSelectBranch={(branches, conditionLabel) => {
              const { nodeId, direction, sourceHandle } = directionalPickerState;
              const opts = { label: conditionLabel || "Ramificazione", conditionQuestion: conditionLabel, branches };
              if (direction === "left") {
                onInsertBeforeNode?.(nodeId, "smart-condition", opts);
              } else if (direction === "top" || direction === "bottom") {
                onBranchFromNode?.(nodeId, "smart-condition", opts, direction);
              } else {
                resolveInsert(nodeId, "smart-condition", opts, sourceHandle);
              }
              setDirectionalPickerState(null);
            }}
          />
        </FloatingPopover>
      )}

      {/* Node Context Menu */}
      <AnimatePresence>
        {contextMenu.visible && (() => {
          const menuItems: { key: string; content: React.ReactNode }[] = [];
          let idx = 0;
          if (contextMenu.nodeType !== "sourceNode") {
            menuItems.push({
              key: "edit",
              content: (
                <motion.button
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.12, delay: idx * 0.03, ease: [0.25, 0.1, 0.25, 1] }}
                  onClick={() => { triggerNodeEdit(contextMenu.nodeId); closeContextMenu(); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono hover:bg-muted active:bg-muted/80 transition-colors text-left"
                >
                  <Pencil className="w-3 h-3" />
                  Modifica
                </motion.button>
              ),
            });
            idx++;
            menuItems.push({
              key: "insert",
              content: (
                <motion.button
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.12, delay: idx * 0.03, ease: [0.25, 0.1, 0.25, 1] }}
                  onClick={() => { onInsertAfter?.(contextMenu.nodeId); closeContextMenu(); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono hover:bg-muted active:bg-muted/80 transition-colors text-left"
                >
                  <PlusCircle className="w-3 h-3" />
                  Inserisci dopo
                </motion.button>
              ),
            });
            idx++;
          }
          menuItems.push({
            key: "delete",
            content: (
              <motion.button
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.12, delay: idx * 0.03, ease: [0.25, 0.1, 0.25, 1] }}
                onClick={() => {
                  const node = nodes.find(nn => nn.id === contextMenu.nodeId);
                  setPendingDelete({
                    nodeId: contextMenu.nodeId,
                    nodeType: contextMenu.nodeType,
                    label: (node?.data as Record<string, unknown>)?.label as string || "questo nodo",
                  });
                  closeContextMenu();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono hover:bg-destructive/10 active:bg-destructive/20 text-destructive transition-colors text-left"
              >
                <Trash2 className="w-3 h-3" />
                Elimina
              </motion.button>
            ),
          });

          return (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.97, y: -2 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[160px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              {menuItems.map(item => (
                <div key={item.key}>{item.content}</div>
              ))}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare "{pendingDelete?.label}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione rimuoverà il nodo dal flusso. Puoi annullare con Ctrl+Z.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) {
                  deleteNode(pendingDelete.nodeId, pendingDelete.nodeType, onRemoveSource, onRemoveStep);
                  setPendingDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Floating Popover (generic positioned popover with click-outside/Escape) ──

function FloatingPopover({
  x,
  y,
  onClose,
  children,
}: {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseRef.current();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed z-50"
      style={{ left: x, top: y }}
    >
      <div className="bg-card border border-border rounded-lg shadow-lg">
        {children}
      </div>
    </motion.div>
  );
}
