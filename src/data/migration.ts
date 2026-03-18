import {
  FlowData, FlowNode, FlowConnection, ConditionBranch,
  LegacyFlowData, LegacyFlowStep,
  createEmptyFlow, CONVERGE_ID, BRANCH_COLORS,
} from "./flowTypes";

function generateConnId(sourceId: string, targetId: string, handle?: string): string {
  return `conn-${sourceId}-${targetId}${handle ? `-${handle}` : ""}`;
}

export function migrateLegacyFlow(legacy: LegacyFlowData): FlowData {
  const nodes: FlowNode[] = [];
  const connections: FlowConnection[] = [];
  const conditionBranches: Record<string, ConditionBranch[]> = {};

  // 1. Sources
  for (const src of legacy.sources) {
    nodes.push({
      id: src.id,
      type: "source",
      templateId: src.templateId,
      label: src.label,
      costPerMonth: 0,
      icon: src.icon,
    });
  }

  // 2. Converge node if sources exist
  if (legacy.sources.length > 0) {
    nodes.push({
      id: CONVERGE_ID,
      type: "converge",
      label: "CRM Squadd",
      costPerMonth: 0,
    });
    for (const src of legacy.sources) {
      connections.push({
        id: generateConnId(src.id, CONVERGE_ID),
        sourceId: src.id,
        targetId: CONVERGE_ID,
      });
    }
  }

  // 3. Flatten steps recursively
  const parentId = legacy.sources.length > 0 ? CONVERGE_ID : null;
  flattenSteps(legacy.steps, parentId, undefined, nodes, connections, conditionBranches);

  return { version: 3, nodes, connections, conditionBranches };
}

function flattenSteps(
  steps: LegacyFlowStep[],
  parentId: string | null,
  parentHandle: string | undefined,
  nodes: FlowNode[],
  connections: FlowConnection[],
  conditionBranches: Record<string, ConditionBranch[]>,
) {
  let prevId = parentId;
  let prevHandle = parentHandle;

  for (const step of steps) {
    const node: FlowNode = {
      id: step.id,
      type: step.type,
      templateId: step.templateId,
      label: step.label,
      note: step.note,
      costPerMonth: 0,
      icon: step.icon,
      conditionQuestion: step.conditionQuestion,
    };
    nodes.push(node);

    if (prevId) {
      connections.push({
        id: generateConnId(prevId, step.id, prevHandle),
        sourceId: prevId,
        targetId: step.id,
        sourceHandle: prevHandle,
      });
    }

    if (step.type === "condition") {
      // Create branches
      const branches: ConditionBranch[] = [
        { id: "branch-0", label: "Sì", color: BRANCH_COLORS[0] },
        { id: "branch-1", label: "No", color: BRANCH_COLORS[1] },
      ];
      conditionBranches[step.id] = branches;

      // Flatten yes branch
      if (step.yesBranch && step.yesBranch.length > 0) {
        flattenSteps(step.yesBranch, step.id, "branch-0", nodes, connections, conditionBranches);
      }

      // Flatten no branch
      if (step.noBranch && step.noBranch.length > 0) {
        flattenSteps(step.noBranch, step.id, "branch-1", nodes, connections, conditionBranches);
      }

      // After a condition, the main chain stops (like the old behavior)
      prevId = null;
      prevHandle = undefined;
    } else {
      prevId = step.id;
      prevHandle = undefined;
    }
  }
}

export function loadAndMigrate(raw: unknown): FlowData {
  if (!raw || typeof raw !== "object") return createEmptyFlow();

  const data = raw as Record<string, unknown>;

  // New format v3
  if (data.version === 3 && Array.isArray(data.nodes)) {
    return data as unknown as FlowData;
  }

  // Legacy format (has sources and steps arrays, no version)
  if (Array.isArray(data.sources) && Array.isArray(data.steps)) {
    return migrateLegacyFlow(data as unknown as LegacyFlowData);
  }

  return createEmptyFlow();
}
