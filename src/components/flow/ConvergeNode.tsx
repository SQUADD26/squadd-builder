import { Handle, Position } from "@xyflow/react";
import { NodeAddHandles } from "./NodeAddHandles";

export function ConvergeNode({ data }: { data: any }) {
  return (
    <div className="group relative flex items-center gap-2 px-5 py-2.5 border border-lime/30 bg-primary text-primary-foreground rounded-full shadow-node font-mono text-xs font-bold min-w-[80px] justify-center transition-[box-shadow,border-color] duration-base ease-standard hover:shadow-node-hover hover:border-lime/50 animate-node-enter">
      <span>{data.label}</span>

      {data.onDirectionalAdd && (
        <NodeAddHandles nodeId={data.id} onDirectionalAdd={data.onDirectionalAdd} directions={["right"]} />
      )}

      <Handle type="target" position={Position.Left} className="!bg-lime/60 !w-2 !h-2 !border !border-lime/30" />
      <Handle type="source" position={Position.Right} className="!bg-lime/60 !w-2 !h-2 !border !border-lime/30" />
      <Handle type="source" id="bottom-source" position={Position.Bottom} className="!bg-primary-foreground !w-2 !h-2 !border-2 !border-primary !opacity-0" />
      <Handle type="target" id="top-target" position={Position.Top} className="!bg-primary-foreground !w-2 !h-2 !border-2 !border-primary !opacity-0" />
      <Handle type="source" id="top-source" position={Position.Top} className="!bg-primary-foreground !w-2 !h-2 !border-2 !border-primary !opacity-0" />
      <Handle type="target" id="bottom-target" position={Position.Bottom} className="!bg-primary-foreground !w-2 !h-2 !border-2 !border-primary !opacity-0" />
    </div>
  );
}
