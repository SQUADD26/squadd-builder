export type StepType = "source" | "action" | "condition" | "converge" | "parallel" | "smart-condition";

export interface FlowNode {
  id: string;
  type: StepType;
  templateId?: string;
  label: string;
  note?: string;
  costPerMonth: number;
  icon?: string;
  conditionQuestion?: string;
}

export type ConnectionDirection = "right" | "left" | "top" | "bottom";

export interface FlowConnection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle?: string;
  label?: string;
  direction?: ConnectionDirection;
}

export interface ConditionBranch {
  id: string;
  label: string;
  color: string;
}

export interface FlowData {
  version: 3;
  nodes: FlowNode[];
  connections: FlowConnection[];
  conditionBranches: Record<string, ConditionBranch[]>;
}

// Legacy types for migration
export interface LegacyFlowStep {
  id: string;
  type: "source" | "action" | "condition" | "converge";
  templateId?: string;
  label: string;
  note?: string;
  costPerMonth: number;
  icon?: string;
  conditionQuestion?: string;
  yesBranch?: LegacyFlowStep[];
  noBranch?: LegacyFlowStep[];
}

export interface LegacyFlowData {
  sources: LegacyFlowStep[];
  steps: LegacyFlowStep[];
}

// Keep FlowStep as alias for backward compat in ai.ts / generatePdf.ts
export type FlowStep = FlowNode;

export function createEmptyFlow(): FlowData {
  return {
    version: 3,
    nodes: [],
    connections: [],
    conditionBranches: {},
  };
}

export const CONVERGE_ID = "__converge";

export const BRANCH_COLORS = [
  "hsl(160 40% 40%)",  // teal
  "hsl(0 50% 45%)",    // red
  "hsl(210 50% 50%)",  // blue
  "hsl(40 60% 50%)",   // amber
  "hsl(280 40% 50%)",  // purple
  "hsl(320 40% 50%)",  // pink
];
