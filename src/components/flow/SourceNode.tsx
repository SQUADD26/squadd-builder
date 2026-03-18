import { Handle, Position } from "@xyflow/react";
import { Globe } from "lucide-react";
import { NodeActionToolbar } from "./NodeActionToolbar";
import { NodeAddHandles } from "./NodeAddHandles";
import { SOURCE_ICON_MAP } from "./iconMaps";

export function SourceNode({ data }: { data: any }) {
  const Icon = SOURCE_ICON_MAP[data.icon] || Globe;
  return (
    <>
      <NodeActionToolbar
        nodeId={data.id}
        nodeType="source"
        isVisible={!!data.isSelected}
        onDelete={data.onToolbarDelete}
      />
      <div className={`group relative flex rounded-lg border border-lime/20 hover:border-lime/40 bg-card shadow-node transition-[box-shadow,border-color] duration-base ease-standard hover:shadow-node-hover min-w-[180px] animate-node-enter ${data.isSelected ? "ring-2 ring-lime/50 ring-offset-1 ring-offset-background shadow-node-hover" : ""}`}>
        {data.onDirectionalAdd && (
          <NodeAddHandles nodeId={data.id} onDirectionalAdd={data.onDirectionalAdd} directions={["right", "bottom"]} />
        )}
        <div className="flex items-center gap-2 px-3 py-2.5 font-mono text-xs font-medium flex-1">
          <Icon className="w-3.5 h-3.5 shrink-0 text-node-source" />
          <span className="flex-1">{data.label}</span>
          {data.costPerMonth > 0 && (
            <span className="text-muted-foreground tabular-nums text-2xs">€{data.costPerMonth}</span>
          )}
        </div>
        <Handle type="source" position={Position.Right} className="!bg-lime/60 !w-2 !h-2 !border !border-lime/30" />
        <Handle type="source" id="bottom-source" position={Position.Bottom} className="!bg-node-source !w-2 !h-2 !border-2 !border-background !opacity-0" />
        <Handle type="target" id="top-target" position={Position.Top} className="!bg-node-source !w-2 !h-2 !border-2 !border-background !opacity-0" />
        <Handle type="source" id="top-source" position={Position.Top} className="!bg-node-source !w-2 !h-2 !border-2 !border-background !opacity-0" />
        <Handle type="target" id="bottom-target" position={Position.Bottom} className="!bg-node-source !w-2 !h-2 !border-2 !border-background !opacity-0" />
      </div>
    </>
  );
}
