import {
  FlowData, FlowNode, FlowConnection, ConditionBranch,
  createEmptyFlow, CONVERGE_ID, BRANCH_COLORS,
} from "@/data/flowTypes";

// ── Helpers ──────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function connId(src: string, tgt: string, handle?: string): string {
  return `conn-${src}-${tgt}${handle ? `-${handle}` : ""}`;
}

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ── Query helpers ────────────────────────────────────────

export function getOutgoing(flow: FlowData, nodeId: string): FlowConnection[] {
  return flow.connections.filter(c => c.sourceId === nodeId);
}

export function getIncoming(flow: FlowData, nodeId: string): FlowConnection[] {
  return flow.connections.filter(c => c.targetId === nodeId);
}

/** Follow linear chain from startId, return last node id */
export function getChainTail(flow: FlowData, startId: string): string {
  let current = startId;
  for (;;) {
    const out = getOutgoing(flow, current);
    if (out.length !== 1) break;
    const node = flow.nodes.find(n => n.id === out[0].targetId);
    if (!node || node.type === "converge") break;
    current = out[0].targetId;
  }
  return current;
}

/** DFS cycle detection: would adding sourceId→targetId create a cycle? */
export function wouldCreateCycle(flow: FlowData, sourceId: string, targetId: string): boolean {
  // If targetId can reach sourceId through existing connections, adding sourceId→targetId creates a cycle
  const visited = new Set<string>();
  const stack = [targetId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === sourceId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const conn of getOutgoing(flow, current)) {
      stack.push(conn.targetId);
    }
  }
  return false;
}

// ── Node CRUD ────────────────────────────────────────────

export function addNode(
  flow: FlowData,
  type: FlowNode["type"],
  opts?: { templateId?: string; label?: string; icon?: string; conditionQuestion?: string; branches?: { label: string }[] }
): { flow: FlowData; nodeId: string } {
  const nodeId = generateId();
  const node: FlowNode = {
    id: nodeId,
    type,
    templateId: opts?.templateId,
    label: opts?.label || "Nuovo step",
    icon: opts?.icon,
    costPerMonth: 0,
    conditionQuestion: opts?.conditionQuestion,
  };

  const next = clone(flow);
  next.nodes.push(node);

  // If condition/parallel/smart-condition, initialize branches
  if (type === "condition" || type === "parallel" || type === "smart-condition") {
    if (type === "smart-condition" && opts?.branches) {
      next.conditionBranches[nodeId] = opts.branches.map((b, i) => ({
        id: `branch-${i}`,
        label: b.label,
        color: BRANCH_COLORS[i % BRANCH_COLORS.length],
      }));
    } else if (type === "smart-condition") {
      next.conditionBranches[nodeId] = [
        { id: "branch-0", label: "Sì", color: BRANCH_COLORS[0] },
        { id: "branch-1", label: "No", color: BRANCH_COLORS[1] },
      ];
    } else {
      next.conditionBranches[nodeId] = [
        { id: "branch-0", label: type === "condition" ? "Sì" : "Ramo 1", color: BRANCH_COLORS[0] },
        { id: "branch-1", label: type === "condition" ? "No" : "Ramo 2", color: BRANCH_COLORS[1] },
      ];
    }
  }

  return { flow: next, nodeId };
}

export function removeNode(flow: FlowData, nodeId: string): FlowData {
  // Never remove converge directly
  if (nodeId === CONVERGE_ID) return flow;

  const next = clone(flow);
  next.nodes = next.nodes.filter(n => n.id !== nodeId);
  next.connections = next.connections.filter(c => c.sourceId !== nodeId && c.targetId !== nodeId);
  delete next.conditionBranches[nodeId];
  return next;
}

export function updateNode(flow: FlowData, nodeId: string, updates: Partial<Pick<FlowNode, "label" | "note" | "conditionQuestion" | "icon">>): FlowData {
  const next = clone(flow);
  const node = next.nodes.find(n => n.id === nodeId);
  if (!node) return flow;
  Object.assign(node, updates);
  return next;
}

// ── Connection CRUD ──────────────────────────────────────

export function addConnection(
  flow: FlowData,
  sourceId: string,
  targetId: string,
  sourceHandle?: string,
  label?: string
): { flow: FlowData; connId: string } | null {
  // Prevent cycles
  if (wouldCreateCycle(flow, sourceId, targetId)) return null;
  // Prevent duplicates
  if (flow.connections.some(c => c.sourceId === sourceId && c.targetId === targetId && c.sourceHandle === sourceHandle)) {
    return null;
  }

  const id = connId(sourceId, targetId, sourceHandle);
  const next = clone(flow);
  next.connections.push({ id, sourceId, targetId, sourceHandle, label });
  return { flow: next, connId: id };
}

export function removeConnection(flow: FlowData, connectionId: string): FlowData {
  const next = clone(flow);
  next.connections = next.connections.filter(c => c.id !== connectionId);
  return next;
}

// ── Composite operations ─────────────────────────────────

/** Insert a new node in the middle of an existing connection */
export function insertBetween(
  flow: FlowData,
  connectionId: string,
  type: FlowNode["type"],
  opts?: { templateId?: string; label?: string; icon?: string; conditionQuestion?: string; branches?: { label: string }[] }
): { flow: FlowData; nodeId: string } | null {
  const conn = flow.connections.find(c => c.id === connectionId);
  if (!conn) return null;

  // Create the new node
  const { flow: withNode, nodeId } = addNode(flow, type, opts);

  // Remove old connection
  const next = clone(withNode);
  next.connections = next.connections.filter(c => c.id !== connectionId);

  // Add source → newNode
  next.connections.push({
    id: connId(conn.sourceId, nodeId, conn.sourceHandle),
    sourceId: conn.sourceId,
    targetId: nodeId,
    sourceHandle: conn.sourceHandle,
  });

  // Add newNode → target
  if (type === "condition" || type === "parallel" || type === "smart-condition") {
    // Branching node: connect each branch to the target
    const branches = next.conditionBranches[nodeId] || [];
    for (const branch of branches) {
      next.connections.push({
        id: connId(nodeId, conn.targetId, branch.id),
        sourceId: nodeId,
        targetId: conn.targetId,
        sourceHandle: branch.id,
      });
    }
  } else {
    next.connections.push({
      id: connId(nodeId, conn.targetId),
      sourceId: nodeId,
      targetId: conn.targetId,
    });
  }

  return { flow: next, nodeId };
}

/** Add a source node + auto-connect to converge */
export function addSource(
  flow: FlowData,
  templateId: string,
  label: string,
  icon?: string
): FlowData {
  // Don't add duplicate sources
  if (flow.nodes.some(n => n.type === "source" && n.templateId === templateId)) return flow;

  const next = clone(flow);
  const nodeId = generateId();

  next.nodes.push({
    id: nodeId,
    type: "source",
    templateId,
    label,
    icon,
    costPerMonth: 0,
  });

  // Ensure converge node exists
  if (!next.nodes.some(n => n.id === CONVERGE_ID)) {
    next.nodes.push({
      id: CONVERGE_ID,
      type: "converge",
      label: "CRM Squadd",
      costPerMonth: 0,
    });
  }

  // Connect source → converge
  next.connections.push({
    id: connId(nodeId, CONVERGE_ID),
    sourceId: nodeId,
    targetId: CONVERGE_ID,
  });

  return next;
}

/** Remove a source node; if no sources left, also remove converge */
export function removeSource(flow: FlowData, nodeId: string): FlowData {
  const next = removeNode(flow, nodeId);

  // Check if any sources remain
  const remainingSources = next.nodes.filter(n => n.type === "source");
  if (remainingSources.length === 0) {
    // Remove converge + its connections
    const convergeOut = getOutgoing(next, CONVERGE_ID);
    next.nodes = next.nodes.filter(n => n.id !== CONVERGE_ID);
    next.connections = next.connections.filter(c => c.sourceId !== CONVERGE_ID && c.targetId !== CONVERGE_ID);

    // If converge had outgoing connections, the first step after converge becomes disconnected — that's ok
    void convergeOut;
  }

  return next;
}

/** Append a step to the end of the main chain */
export function addStepToEnd(
  flow: FlowData,
  type: FlowNode["type"],
  opts?: { templateId?: string; label?: string; icon?: string; conditionQuestion?: string; branches?: { label: string }[] }
): { flow: FlowData; nodeId: string } {
  const { flow: withNode, nodeId } = addNode(flow, type, opts);
  const next = clone(withNode);

  // Find the tail of the main chain
  const converge = next.nodes.find(n => n.id === CONVERGE_ID);
  const sources = next.nodes.filter(n => n.type === "source");

  let tailId: string | null = null;

  if (converge) {
    tailId = getChainTail(next, CONVERGE_ID);
  } else if (sources.length === 0) {
    // No sources, no converge — find any node that has no outgoing connections (excluding the new node)
    const nodesWithoutOut = next.nodes.filter(n =>
      n.id !== nodeId && getOutgoing(next, n.id).length === 0
    );
    if (nodesWithoutOut.length > 0) {
      tailId = nodesWithoutOut[0].id;
    }
  }

  if (tailId && tailId !== nodeId) {
    next.connections.push({
      id: connId(tailId, nodeId),
      sourceId: tailId,
      targetId: nodeId,
    });
  }

  return { flow: next, nodeId };
}

/** Add step to a specific branch of a condition/parallel node */
export function addStepToBranch(
  flow: FlowData,
  condNodeId: string,
  branchId: string,
  type: FlowNode["type"],
  opts?: { templateId?: string; label?: string; icon?: string }
): { flow: FlowData; nodeId: string } {
  const { flow: withNode, nodeId } = addNode(flow, type, opts);
  const next = clone(withNode);

  // Find existing nodes on this branch
  const branchConns = next.connections.filter(
    c => c.sourceId === condNodeId && c.sourceHandle === branchId
  );

  if (branchConns.length === 0) {
    // First node on this branch — connect directly from condition
    next.connections.push({
      id: connId(condNodeId, nodeId, branchId),
      sourceId: condNodeId,
      targetId: nodeId,
      sourceHandle: branchId,
    });
  } else {
    // Find tail of this branch chain
    const firstOnBranch = branchConns[0].targetId;
    const tail = getChainTail(next, firstOnBranch);
    next.connections.push({
      id: connId(tail, nodeId),
      sourceId: tail,
      targetId: nodeId,
    });
  }

  return { flow: next, nodeId };
}

// ── Branch management ────────────────────────────────────

export function addBranch(
  flow: FlowData,
  condNodeId: string,
  label?: string
): { flow: FlowData; branchId: string } {
  const next = clone(flow);
  const branches = next.conditionBranches[condNodeId] || [];
  const idx = branches.length;
  const branchId = `branch-${idx}`;
  const color = BRANCH_COLORS[idx % BRANCH_COLORS.length];

  branches.push({
    id: branchId,
    label: label || `Ramo ${idx + 1}`,
    color,
  });
  next.conditionBranches[condNodeId] = branches;

  return { flow: next, branchId };
}

export function removeBranch(flow: FlowData, condNodeId: string, branchId: string): FlowData {
  const next = clone(flow);
  const branches = next.conditionBranches[condNodeId];
  if (!branches) return flow;

  // Remove branch definition
  next.conditionBranches[condNodeId] = branches.filter(b => b.id !== branchId);

  // Remove all connections from this branch and their downstream nodes
  const branchConns = next.connections.filter(
    c => c.sourceId === condNodeId && c.sourceHandle === branchId
  );

  // Collect all downstream node IDs to remove
  const toRemove = new Set<string>();
  for (const bc of branchConns) {
    collectDownstream(next, bc.targetId, toRemove);
  }

  // Remove downstream nodes and their connections
  next.nodes = next.nodes.filter(n => !toRemove.has(n.id));
  next.connections = next.connections.filter(
    c => !toRemove.has(c.sourceId) && !toRemove.has(c.targetId) &&
      !(c.sourceId === condNodeId && c.sourceHandle === branchId)
  );

  // Clean up conditionBranches for removed nodes
  for (const id of toRemove) {
    delete next.conditionBranches[id];
  }

  return next;
}

/** Collect all nodes reachable from startId (exclusive of nodes with incoming from outside) */
function collectDownstream(flow: FlowData, startId: string, collected: Set<string>) {
  if (collected.has(startId)) return;
  collected.add(startId);
  for (const conn of getOutgoing(flow, startId)) {
    collectDownstream(flow, conn.targetId, collected);
  }
}

export function updateConnectionLabel(flow: FlowData, connectionId: string, label: string | undefined): FlowData {
  const next = clone(flow);
  const conn = next.connections.find(c => c.id === connectionId);
  if (!conn) return flow;
  conn.label = label;
  return next;
}

export function insertSmartCondition(
  flow: FlowData,
  connectionId: string,
  branches: { label: string }[],
  conditionLabel?: string,
): { flow: FlowData; nodeId: string } | null {
  const result = insertBetween(flow, connectionId, "smart-condition", {
    label: conditionLabel || "Condizione",
    conditionQuestion: conditionLabel,
    branches,
  });
  return result;
}

export function renameBranch(flow: FlowData, condNodeId: string, branchId: string, label: string): FlowData {
  const next = clone(flow);
  const branches = next.conditionBranches[condNodeId];
  if (!branches) return flow;
  const branch = branches.find(b => b.id === branchId);
  if (branch) branch.label = label;
  return next;
}

// ── Add branch from a node (new outgoing, no insertBetween) ──

/** Add a new node with a direct connection from the given node.
 *  Unlike insertAfterNode, this does NOT break existing connections —
 *  it creates an additional outgoing edge.
 *  The `direction` controls where the layout engine places the new node. */
export function addBranchFromNode(
  flow: FlowData,
  fromNodeId: string,
  type: FlowNode["type"],
  opts?: { templateId?: string; label?: string; icon?: string; conditionQuestion?: string; branches?: { label: string }[] },
  direction?: FlowConnection["direction"],
  sourceHandle?: string,
): FlowData {
  const { flow: withNode, nodeId } = addNode(flow, type, opts);
  const next = clone(withNode);
  const connDirection = direction === "right" ? undefined : (direction || "bottom");
  next.connections.push({
    id: connId(fromNodeId, nodeId, sourceHandle),
    sourceId: fromNodeId,
    targetId: nodeId,
    ...(sourceHandle ? { sourceHandle } : {}),
    ...(connDirection ? { direction: connDirection } : {}),
  });
  return next;
}

// ── Insert before a specific node ─────────────────────────

/** Insert a new node before a given node.
 *  If the node has exactly one incoming connection, insert between parent and this node.
 *  Otherwise, create the new node and connect it to this node. */
export function insertBeforeNode(
  flow: FlowData,
  beforeNodeId: string,
  type: FlowNode["type"],
  opts?: { templateId?: string; label?: string; icon?: string; conditionQuestion?: string; branches?: { label: string }[] }
): FlowData {
  const incoming = getIncoming(flow, beforeNodeId);

  if (incoming.length === 1) {
    const result = insertBetween(flow, incoming[0].id, type, opts);
    return result ? result.flow : flow;
  }

  // No incoming — create node and connect to beforeNode
  const { flow: withNode, nodeId } = addNode(flow, type, opts);
  const next = clone(withNode);
  next.connections.push({
    id: connId(nodeId, beforeNodeId),
    sourceId: nodeId,
    targetId: beforeNodeId,
  });
  return next;
}

// ── Fork parallel sibling ─────────────────────────────────

/** Create a new node as a sibling of the given node (same parent).
 *  The new node gets a connection from the same source as the sibling. */
export function forkParallelSibling(
  flow: FlowData,
  siblingNodeId: string,
  type: FlowNode["type"],
  opts?: { templateId?: string; label?: string; icon?: string; conditionQuestion?: string; branches?: { label: string }[] }
): FlowData {
  const incoming = getIncoming(flow, siblingNodeId);
  if (incoming.length === 0) {
    // No parent — just add to end
    return addStepToEnd(flow, type, opts).flow;
  }

  const parentConn = incoming[0];
  const { flow: withNode, nodeId } = addNode(flow, type, opts);
  const next = clone(withNode);

  next.connections.push({
    id: connId(parentConn.sourceId, nodeId),
    sourceId: parentConn.sourceId,
    targetId: nodeId,
  });

  return next;
}

// ── Insert after a specific node ──────────────────────────

/** Insert a new node after a given node. If the node has a single outgoing connection
 *  (without sourceHandle, i.e. main chain), insert between. Otherwise append.
 *  For condition/parallel nodes (all outgoing have sourceHandle), falls back to addStepToEnd. */
export function insertAfterNode(
  flow: FlowData,
  afterNodeId: string,
  type: FlowNode["type"],
  opts?: { templateId?: string; label?: string; icon?: string; conditionQuestion?: string; branches?: { label: string }[] }
): FlowData {
  const afterNode = flow.nodes.find(n => n.id === afterNodeId);

  // Condition/parallel nodes use branches — add to the first branch's tail instead
  if (afterNode && (afterNode.type === "condition" || afterNode.type === "parallel" || afterNode.type === "smart-condition")) {
    const branches = flow.conditionBranches[afterNodeId];
    if (branches && branches.length > 0) {
      // Insert after the tail of the first branch
      const branchConns = getOutgoing(flow, afterNodeId).filter(c => c.sourceHandle === branches[0].id);
      if (branchConns.length > 0) {
        const branchTail = getChainTail(flow, branchConns[0].targetId);
        return insertAfterNode(flow, branchTail, type, opts);
      }
      // Branch is empty — add as first node on the branch
      return addStepToBranch(flow, afterNodeId, branches[0].id, type, opts).flow;
    }
    return addStepToEnd(flow, type, opts).flow;
  }

  // Find outgoing connections without sourceHandle (main chain)
  const outgoing = getOutgoing(flow, afterNodeId).filter(c => !c.sourceHandle);

  if (outgoing.length === 1) {
    // Insert between afterNode and its successor
    const result = insertBetween(flow, outgoing[0].id, type, opts);
    return result ? result.flow : addStepToEnd(flow, type, opts).flow;
  }

  // No outgoing connection — just append after
  const { flow: withNode, nodeId } = addNode(flow, type, opts);
  const next = clone(withNode);
  next.connections.push({
    id: connId(afterNodeId, nodeId),
    sourceId: afterNodeId,
    targetId: nodeId,
  });
  return next;
}

// ── Bulk helper: remove step and reconnect ───────────────

/** Remove a node and reconnect its single incoming to its single outgoing (if both exist) */
export function removeAndReconnect(flow: FlowData, nodeId: string): FlowData {
  const incoming = getIncoming(flow, nodeId);
  const outgoing = getOutgoing(flow, nodeId);

  let next = removeNode(flow, nodeId);

  // If there was exactly one incoming and one outgoing, reconnect them
  if (incoming.length === 1 && outgoing.length === 1) {
    const src = incoming[0];
    const tgt = outgoing[0];
    next = clone(next);
    next.connections.push({
      id: connId(src.sourceId, tgt.targetId, src.sourceHandle),
      sourceId: src.sourceId,
      targetId: tgt.targetId,
      sourceHandle: src.sourceHandle,
    });
  }

  return next;
}
