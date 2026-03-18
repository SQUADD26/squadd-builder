import { useState, useRef, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import { GitFork, Pencil, Plus } from "lucide-react";
import type { ConditionBranch } from "@/data/flowTypes";
import { NodeAddHandles } from "./NodeAddHandles";

export function SmartConditionNode({ data }: { data: any }) {
  const [editing, setEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(data.conditionQuestion || data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const branches: ConditionBranch[] = data.branches || [];

  useEffect(() => {
    setLabelValue(data.conditionQuestion || data.label);
  }, [data.conditionQuestion, data.label]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    setEditing(false);
    if (data.onUpdateNote && labelValue.trim()) {
      data.onUpdateNote(data.id, labelValue);
    }
  };

  return (
    <>
      <div
        onClick={() => setEditing(true)}
        className={`group relative rounded-xl shadow-node font-mono text-xs cursor-pointer transition-[box-shadow,border-color] duration-base ease-standard hover:shadow-node-hover animate-node-enter ${
          data.isSelected
            ? "ring-2 ring-lime/50 ring-offset-1 ring-offset-background shadow-node-hover"
            : ""
        } border border-node-condition/30 hover:border-node-condition/60`}
        style={{
          background: "hsl(var(--card) / 0.95)",
          minWidth: 160,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 px-3 py-2">
          <GitFork className="w-3.5 h-3.5 shrink-0 text-node-condition" />
          {editing ? (
            <input
              ref={inputRef}
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") {
                  setLabelValue(data.conditionQuestion || data.label);
                  setEditing(false);
                }
              }}
              className="flex-1 bg-transparent outline-none text-xs font-medium nopan nodrag min-w-0"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 font-medium text-foreground">
              {data.conditionQuestion || data.label}
            </span>
          )}
          {!editing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-foreground nopan nodrag"
            >
              <Pencil className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Branch list */}
        {branches.length > 0 && (
          <div className="flex flex-col gap-0.5 px-3 pb-2 -mt-0.5">
            {branches.map((b) => (
              <div key={b.id} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: b.color }}
                />
                <span
                  className="text-[11px] font-mono flex-1"
                  style={{ color: b.color }}
                >
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Left-side add handle */}
        {data.onDirectionalAdd && (
          <NodeAddHandles nodeId={data.id} onDirectionalAdd={data.onDirectionalAdd} directions={["left"]} />
        )}

        {/* Target handle */}
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-node-condition/60 !w-2 !h-2 !border !border-node-condition/30"
        />

        {/* Branch handles — dot becomes "+" on hover */}
        {branches.map((b, i) => {
          const topPercent = ((i + 1) / (branches.length + 1)) * 100;
          return (
            <div
              key={b.id}
              className="group/handle absolute nopan nodrag cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                data.onBranchAdd?.(data.id, b.id, e.clientX, e.clientY);
              }}
              style={{
                right: 0,
                top: `${topPercent}%`,
                transform: "translate(50%, -50%)",
                zIndex: 10,
              }}
            >
              <div
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-transform duration-150 group-hover/handle:scale-150 border-2 border-background pointer-events-none"
                style={{ backgroundColor: b.color }}
                title={`Aggiungi dopo "${b.label}"`}
              >
                <Plus className="w-2.5 h-2.5 text-background opacity-0 group-hover/handle:opacity-100 transition-opacity duration-150" strokeWidth={3} />
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={b.id}
                className="!absolute !inset-0 !w-full !h-full !opacity-0 !transform-none !translate-x-0 !translate-y-0 !top-0 !left-0 !rounded-full"
              />
            </div>
          );
        })}

        {/* Directional handles (hidden) */}
        <Handle type="source" id="bottom-source" position={Position.Bottom} className="!bg-node-condition !w-2 !h-2 !border-2 !border-background !opacity-0" />
        <Handle type="target" id="top-target" position={Position.Top} className="!bg-node-condition !w-2 !h-2 !border-2 !border-background !opacity-0" />
        <Handle type="source" id="top-source" position={Position.Top} className="!bg-node-condition !w-2 !h-2 !border-2 !border-background !opacity-0" />
        <Handle type="target" id="bottom-target" position={Position.Bottom} className="!bg-node-condition !w-2 !h-2 !border-2 !border-background !opacity-0" />
      </div>
    </>
  );
}
