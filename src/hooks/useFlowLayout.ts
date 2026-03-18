import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";
import { FlowData, FlowNode, FlowConnection, CONVERGE_ID } from "@/data/flowTypes";
import {
  SOURCE_TEMPLATES, STEP_TEMPLATES,
  getCompetitorCost, type PriceTier,
} from "@/data/templates";

// ── Node dimensions by type ──────────────────────────────

const NODE_SIZES: Record<string, { w: number; h: number }> = {
  source: { w: 180, h: 60 },
  action: { w: 210, h: 70 },
  condition: { w: 220, h: 85 },
  converge: { w: 140, h: 50 },
  parallel: { w: 180, h: 70 },
  "smart-condition": { w: 200, h: 120 },
  trigger: { w: 200, h: 60 },
};

function getSize(type: string) {
  return NODE_SIZES[type] || NODE_SIZES.action;
}

// ── ReactFlow node type mapping ──────────────────────────

const RF_NODE_TYPE: Record<string, string> = {
  source: "sourceNode",
  action: "actionNode",
  condition: "conditionNode",
  converge: "convergeNode",
  parallel: "parallelNode",
  "smart-condition": "smartConditionNode",
};

// ── Cost lookup ──────────────────────────────────────────

function getNodeCost(templateId: string | undefined, tier: PriceTier): number {
  if (!templateId) return 0;
  const srcT = SOURCE_TEMPLATES.find(t => t.id === templateId);
  if (srcT?.competitorId) return getCompetitorCost(srcT.competitorId, tier);
  const stepT = STEP_TEMPLATES.find(t => t.id === templateId);
  if (stepT?.competitorId) return getCompetitorCost(stepT.competitorId, tier);
  return 0;
}

// ── Vertical gap between parent and vertical-branch child ─

const VERTICAL_GAP = 80;

// ── Main layout function ─────────────────────────────────

export interface LayoutCallbacks {
  onUpdateNote?: (id: string, note: string) => void;
  onSelectSource?: (templateId: string) => void;
  onRemoveSource?: (id: string) => void;
}

export function layoutFlow(
  flow: FlowData,
  callbacks: LayoutCallbacks = {},
  tier: PriceTier = "budget",
  existingPositions?: Record<string, { x: number; y: number }>,
): { nodes: Node[]; edges: Edge[] } {
  // Empty flow: still show the trigger placeholder
  if (flow.nodes.length === 0) {
    const triggerPos = existingPositions?.["__trigger"] || { x: 40, y: 40 };
    return {
      nodes: [
        {
          id: "__trigger",
          type: "triggerNode",
          position: triggerPos,
          draggable: false,
          data: {
            id: "__trigger",
            sourceCount: 0,
            activeSources: [],
            onSelectSource: callbacks.onSelectSource,
          },
        },
      ],
      edges: [],
    };
  }

  // Separate horizontal (dagre-managed) and vertical (manually positioned) connections
  const horizontalConns: FlowConnection[] = [];
  const verticalConns: FlowConnection[] = [];

  for (const conn of flow.connections) {
    if (conn.direction === "top" || conn.direction === "bottom") {
      verticalConns.push(conn);
    } else {
      horizontalConns.push(conn);
    }
  }

  // Collect nodes targeted by vertical connections — they and their
  // downstream chains are positioned manually, not by dagre.
  const verticalTargetIds = new Set(verticalConns.map(c => c.targetId));

  // Recursively collect all nodes reachable ONLY through vertical targets
  // (so their downstream chains are also excluded from dagre)
  const manualNodeIds = new Set<string>();
  function collectManualChain(nodeId: string) {
    if (manualNodeIds.has(nodeId)) return;
    manualNodeIds.add(nodeId);
    for (const conn of flow.connections) {
      if (conn.sourceId === nodeId && !verticalTargetIds.has(conn.targetId)) {
        // Downstream from a manually-placed node: also manual
        collectManualChain(conn.targetId);
      }
    }
  }
  for (const id of verticalTargetIds) {
    collectManualChain(id);
  }

  // Determine which nodes are new (no existing position)
  const existingNodeIds = existingPositions ? new Set(Object.keys(existingPositions)) : new Set<string>();
  const flowNodeIds = new Set(flow.nodes.map(n => n.id));
  const newNodeIds = new Set(flow.nodes.filter(n => !existingNodeIds.has(n.id)).map(n => n.id));
  // Nodes that were removed
  const removedNodeIds = new Set([...existingNodeIds].filter(id => !flowNodeIds.has(id)));

  // If there are existing positions and new nodes, use incremental layout:
  // pin existing nodes, only run dagre to position new nodes
  const hasExisting = existingPositions && existingNodeIds.size > 0 && removedNodeIds.size < existingNodeIds.size;

  // 1. Build dagre graph (only horizontal connections and non-manual nodes)
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "LR",
    ranksep: 100,
    nodesep: 40,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // 2. Add non-manual nodes to dagre
  const TRIGGER_ID = "__trigger";
  const triggerSize = getSize("trigger");
  const sources = flow.nodes.filter(n => n.type === "source");

  // Add trigger to dagre only when no sources (connects to converge)
  if (sources.length === 0) {
    g.setNode(TRIGGER_ID, { width: triggerSize.w, height: triggerSize.h });
    const converge = flow.nodes.find(n => n.id === CONVERGE_ID);
    if (converge && !manualNodeIds.has(CONVERGE_ID)) {
      g.setEdge(TRIGGER_ID, CONVERGE_ID);
    }
  }

  for (const node of flow.nodes) {
    if (manualNodeIds.has(node.id)) continue;
    const { w, h } = getSize(node.type);
    g.setNode(node.id, { width: w, height: h });
  }

  // 3. Add horizontal edges to dagre (only between dagre-managed nodes)
  for (const conn of horizontalConns) {
    if (!manualNodeIds.has(conn.sourceId) && !manualNodeIds.has(conn.targetId)) {
      g.setEdge(conn.sourceId, conn.targetId);
    }
  }

  // 4. Run dagre layout
  dagre.layout(g);

  // 5. Build position map
  const posMap: Record<string, { x: number; y: number }> = {};

  // Position trigger node
  if (sources.length === 0) {
    // No sources: use dagre position (connected to converge)
    if (existingPositions?.[TRIGGER_ID]) {
      posMap[TRIGGER_ID] = existingPositions[TRIGGER_ID];
    } else {
      const triggerDagre = g.node(TRIGGER_ID);
      if (triggerDagre) {
        posMap[TRIGGER_ID] = { x: triggerDagre.x - triggerSize.w / 2, y: triggerDagre.y - triggerSize.h / 2 };
      }
    }
  }
  // When sources exist, trigger is positioned after all dagre nodes are placed (see below)

  if (hasExisting && newNodeIds.size > 0) {
    // Incremental: keep existing nodes pinned, use dagre only for new nodes
    for (const node of flow.nodes) {
      if (manualNodeIds.has(node.id)) continue;

      if (!newNodeIds.has(node.id) && existingPositions[node.id]) {
        // Existing node — keep its position
        posMap[node.id] = existingPositions[node.id];
      } else {
        // New node — use dagre position
        const pos = g.node(node.id);
        if (pos) {
          const { w, h } = getSize(node.type);
          const dagrePos = { x: pos.x - w / 2, y: pos.y - h / 2 };

          // Try to position relative to connected existing nodes for better placement
          const incomingConn = horizontalConns.find(c => c.targetId === node.id && !newNodeIds.has(c.sourceId));
          const outgoingConn = horizontalConns.find(c => c.sourceId === node.id && !newNodeIds.has(c.targetId));

          if (incomingConn && existingPositions[incomingConn.sourceId] && outgoingConn && existingPositions[outgoingConn.targetId]) {
            // Inserted between two existing nodes — position midway
            const srcPos = existingPositions[incomingConn.sourceId];
            const tgtPos = existingPositions[outgoingConn.targetId];
            const srcNode = flow.nodes.find(n => n.id === incomingConn.sourceId);
            const srcSize = srcNode ? getSize(srcNode.type) : getSize("action");
            posMap[node.id] = {
              x: srcPos.x + srcSize.w + ((tgtPos.x - srcPos.x - srcSize.w) - w) / 2,
              y: (srcPos.y + tgtPos.y) / 2,
            };
          } else if (incomingConn && existingPositions[incomingConn.sourceId]) {
            // Has a parent — position to the right of it
            const parentPos = existingPositions[incomingConn.sourceId];
            const parentNode = flow.nodes.find(n => n.id === incomingConn.sourceId);
            const parentSize = parentNode ? getSize(parentNode.type) : getSize("action");
            posMap[node.id] = {
              x: parentPos.x + parentSize.w + 100,
              y: parentPos.y,
            };
          } else if (outgoingConn && existingPositions[outgoingConn.targetId]) {
            // Has a child — position to the left of it
            const childPos = existingPositions[outgoingConn.targetId];
            // For source nodes: offset Y to avoid stacking on top of siblings
            let offsetY = 0;
            if (node.type === "source") {
              const existingSources = flow.nodes.filter(
                n => n.type === "source" && n.id !== node.id && (posMap[n.id] || existingPositions[n.id])
              );
              if (existingSources.length > 0) {
                let maxBottomY = -Infinity;
                for (const s of existingSources) {
                  const sPos = posMap[s.id] || existingPositions[s.id];
                  if (sPos) {
                    const sSize = getSize(s.type);
                    const bottom = sPos.y + sSize.h;
                    if (bottom > maxBottomY) maxBottomY = bottom;
                  }
                }
                offsetY = maxBottomY + 40 - childPos.y;
              }
            }
            posMap[node.id] = {
              x: childPos.x - w - 100,
              y: childPos.y + offsetY,
            };
          } else {
            // No connected existing nodes — use dagre position
            posMap[node.id] = dagrePos;
          }
        }
      }
    }
  } else {
    // Full layout (first render or major restructure): use dagre for all
    for (const node of flow.nodes) {
      if (manualNodeIds.has(node.id)) continue;
      const pos = g.node(node.id);
      if (pos) {
        const { w, h } = getSize(node.type);
        posMap[node.id] = { x: pos.x - w / 2, y: pos.y - h / 2 };
      }
    }
  }

  // 6. Position vertically-connected nodes relative to their parent
  // Process in topological order so chained vertical nodes work
  const positioned = new Set(Object.keys(posMap));
  let changed = true;
  while (changed) {
    changed = false;
    for (const conn of verticalConns) {
      if (positioned.has(conn.targetId)) continue;
      if (!positioned.has(conn.sourceId)) continue;

      // If we have existing position for this vertical node, keep it
      if (hasExisting && !newNodeIds.has(conn.targetId) && existingPositions[conn.targetId]) {
        posMap[conn.targetId] = existingPositions[conn.targetId];
        positioned.add(conn.targetId);
        changed = true;
        continue;
      }

      const parentPos = posMap[conn.sourceId];
      const parentNode = flow.nodes.find(n => n.id === conn.sourceId);
      const childNode = flow.nodes.find(n => n.id === conn.targetId);
      if (!parentPos || !parentNode || !childNode) continue;

      const parentSize = getSize(parentNode.type);
      const childSize = getSize(childNode.type);

      // Center child horizontally under/above parent
      const cx = parentPos.x + (parentSize.w - childSize.w) / 2;

      if (conn.direction === "bottom") {
        posMap[conn.targetId] = {
          x: cx,
          y: parentPos.y + parentSize.h + VERTICAL_GAP,
        };
      } else {
        // top
        posMap[conn.targetId] = {
          x: cx,
          y: parentPos.y - childSize.h - VERTICAL_GAP,
        };
      }
      positioned.add(conn.targetId);
      changed = true;
    }

    // Also position downstream of manually-placed nodes (horizontal conns from manual nodes)
    for (const conn of horizontalConns) {
      if (positioned.has(conn.targetId)) continue;
      if (!positioned.has(conn.sourceId)) continue;
      if (!manualNodeIds.has(conn.sourceId)) continue;

      // Keep existing position if available
      if (hasExisting && !newNodeIds.has(conn.targetId) && existingPositions[conn.targetId]) {
        posMap[conn.targetId] = existingPositions[conn.targetId];
        positioned.add(conn.targetId);
        changed = true;
        continue;
      }

      const parentPos = posMap[conn.sourceId];
      const parentNode = flow.nodes.find(n => n.id === conn.sourceId);
      const childNode = flow.nodes.find(n => n.id === conn.targetId);
      if (!parentPos || !parentNode || !childNode) continue;

      const parentSize = getSize(parentNode.type);

      // Place to the right of parent (manual horizontal continuation)
      posMap[conn.targetId] = {
        x: parentPos.x + parentSize.w + 100,
        y: parentPos.y,
      };
      positioned.add(conn.targetId);
      changed = true;
    }
  }

  // 7. Map to ReactFlow nodes
  const nodes: Node[] = flow.nodes.map(node => {
    const pos = posMap[node.id] || { x: 0, y: 0 };
    const branches = flow.conditionBranches[node.id];

    return {
      id: node.id,
      type: RF_NODE_TYPE[node.type] || "actionNode",
      position: pos,
      data: {
        ...node,
        costPerMonth: getNodeCost(node.templateId, tier),
        onUpdateNote: callbacks.onUpdateNote,
        branches,
      },
    };
  });

  // 7b. Add trigger node — position depends on whether sources exist
  const activeSourceIds = sources.map(s => s.templateId).filter(Boolean) as string[];
  if (sources.length > 0) {
    // Position below the lowest source node
    let minX = Infinity;
    let maxY = -Infinity;
    for (const source of sources) {
      const pos = posMap[source.id];
      if (pos) {
        const size = getSize(source.type);
        if (pos.x < minX) minX = pos.x;
        if (pos.y + size.h > maxY) maxY = pos.y + size.h;
      }
    }
    // Always recalculate — don't pin, sources may have changed
    const triggerPos = {
      x: minX === Infinity ? 0 : minX,
      y: maxY === -Infinity ? 80 : maxY + 30,
    };
    posMap[TRIGGER_ID] = triggerPos;
    nodes.unshift({
      id: TRIGGER_ID,
      type: "triggerNode",
      position: triggerPos,
      draggable: false,
      data: {
        id: TRIGGER_ID,
        sourceCount: sources.length,
        activeSources: activeSourceIds,
        onSelectSource: callbacks.onSelectSource,
      },
    });
  } else {
    const triggerPos = posMap[TRIGGER_ID] || { x: 40, y: 40 };
    nodes.unshift({
      id: TRIGGER_ID,
      type: "triggerNode",
      position: triggerPos,
      draggable: false,
      data: {
        id: TRIGGER_ID,
        sourceCount: 0,
        activeSources: [],
        onSelectSource: callbacks.onSelectSource,
      },
    });
  }

  // 8. Map to ReactFlow edges
  const edges: Edge[] = flow.connections.map(conn => {
    const sourceNode = flow.nodes.find(n => n.id === conn.sourceId);
    const branches = sourceNode ? flow.conditionBranches[sourceNode.id] : undefined;
    const branch = branches?.find(b => b.id === conn.sourceHandle);

    const style = branch
      ? { stroke: branch.color, strokeWidth: 1.5 }
      : { stroke: "hsl(73 100% 53%)", strokeWidth: 1.5, strokeOpacity: 0.35 };

    // For vertical connections, use bottom/top handles so the edge routes correctly
    let sourceHandle = conn.sourceHandle;
    let targetHandle: string | undefined;
    if (conn.direction === "bottom") {
      sourceHandle = "bottom-source";
      targetHandle = "top-target";
    } else if (conn.direction === "top") {
      sourceHandle = "top-source";
      targetHandle = "bottom-target";
    }

    return {
      id: conn.id,
      source: conn.sourceId,
      target: conn.targetId,
      sourceHandle,
      targetHandle,
      label: branch?.label || conn.label,
      type: "insertable",
      style,
      data: { connectionId: conn.id },
    };
  });

  // 9. When no sources, connect trigger to converge with subtle dashed edge
  if (sources.length === 0) {
    const converge = flow.nodes.find(n => n.id === CONVERGE_ID);
    if (converge) {
      edges.unshift({
        id: `trigger-converge`,
        source: TRIGGER_ID,
        target: CONVERGE_ID,
        type: "insertable",
        style: { stroke: "hsl(73 100% 53%)", strokeWidth: 1.5, strokeOpacity: 0.1, strokeDasharray: "4 4" },
        data: {},
      });
    }
  }

  return { nodes, edges };
}
