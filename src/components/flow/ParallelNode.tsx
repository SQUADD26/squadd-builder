import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import type { ConditionBranch } from "@/data/flowTypes";
import { NodeActionToolbar } from "./NodeActionToolbar";
import { NodeAddHandles } from "./NodeAddHandles";

export function ParallelNode({ data }: { data: any }) {
  const branches: ConditionBranch[] = data.branches || [];

  return (
    <>
      <NodeActionToolbar
        nodeId={data.id}
        nodeType="parallel"
        isVisible={!!data.isSelected}
        onAddAfter={data.onToolbarAddAfter}
        onAddConditionAfter={data.onToolbarAddConditionAfter}
        onAddParallelAfter={data.onToolbarAddParallelAfter}
        onDelete={data.onToolbarDelete}
        onAddBranch={data.onToolbarAddBranch}
      />
      <div className={`group relative border border-lime/20 hover:border-lime/40 bg-card rounded-lg shadow-node font-mono text-xs min-w-[160px] max-w-[200px] transition-[box-shadow,border-color] duration-base ease-standard hover:shadow-node-hover animate-node-enter ${data.isSelected ? "ring-2 ring-lime/50 ring-offset-1 ring-offset-background shadow-node-hover" : ""}`}>
        {data.onDirectionalAdd && (
          <NodeAddHandles nodeId={data.id} onDirectionalAdd={data.onDirectionalAdd} directions={["left", "top", "bottom"]} />
        )}
        <div className="flex items-center gap-2 px-3 py-2.5 font-medium">
          <GitBranch className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">{data.label || "Parallelo"}</span>
        </div>
        {/* Branch labels */}
        {branches.length > 0 && (
          <div className="flex flex-col gap-0.5 px-3 pb-2 text-2xs">
            {branches.map((b) => (
              <span key={b.id} className="font-bold flex items-center gap-1" style={{ color: b.color }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: b.color }} />
                {b.label}
              </span>
            ))}
          </div>
        )}
        {/* Handles */}
        <Handle type="target" position={Position.Left} className="!bg-lime/60 !w-2 !h-2 !border !border-lime/30" />
        {branches.map((b, i) => {
          const topPercent = ((i + 1) / (branches.length + 1)) * 100;
          return (
            <Handle
              key={b.id}
              type="source"
              position={Position.Right}
              id={b.id}
              className="!w-2.5 !h-2.5 !border-2 !border-background"
              style={{ top: `${topPercent}%`, backgroundColor: b.color }}
            />
          );
        })}
        <Handle type="source" id="bottom-source" position={Position.Bottom} className="!bg-muted-foreground !w-2 !h-2 !border-2 !border-background !opacity-0" />
        <Handle type="target" id="top-target" position={Position.Top} className="!bg-muted-foreground !w-2 !h-2 !border-2 !border-background !opacity-0" />
        <Handle type="source" id="top-source" position={Position.Top} className="!bg-muted-foreground !w-2 !h-2 !border-2 !border-background !opacity-0" />
        <Handle type="target" id="bottom-target" position={Position.Bottom} className="!bg-muted-foreground !w-2 !h-2 !border-2 !border-background !opacity-0" />
      </div>
    </>
  );
}
