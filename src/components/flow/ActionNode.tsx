import { useState, useRef, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import { Zap, Pencil } from "lucide-react";
import { NodeActionToolbar } from "./NodeActionToolbar";
import { NodeAddHandles } from "./NodeAddHandles";
import { STEP_ICON_MAP } from "./iconMaps";

export function ActionNode({ data }: { data: any }) {
  const Icon = STEP_ICON_MAP[data.icon] || Zap;
  const [editing, setEditing] = useState(false);
  const [noteValue, setNoteValue] = useState(data.note || "");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setNoteValue(data.note || "");
  }, [data.note]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    setEditing(false);
    if (data.onUpdateNote) {
      data.onUpdateNote(data.id, noteValue);
    }
  };

  return (
    <>
      <NodeActionToolbar
        nodeId={data.id}
        nodeType="action"
        isVisible={!!data.isSelected}
        onAddAfter={data.onToolbarAddAfter}
        onAddConditionAfter={data.onToolbarAddConditionAfter}
        onAddParallelAfter={data.onToolbarAddParallelAfter}
        onEdit={data.onToolbarEdit}
        onDelete={data.onToolbarDelete}
      />
      <div
        className={`group relative bg-card rounded-lg shadow-node font-mono text-xs min-w-[200px] max-w-[240px] transition-[box-shadow,border-color] duration-base ease-standard hover:shadow-node-hover animate-node-enter ${data.isSelected ? "ring-2 ring-lime/50 ring-offset-1 ring-offset-background shadow-node-hover" : ""} ${editing ? "border border-lime" : "border border-lime/20 hover:border-lime/40"}`}
      >
        {data.onDirectionalAdd && (
          <NodeAddHandles nodeId={data.id} onDirectionalAdd={data.onDirectionalAdd} />
        )}
        <div className="flex items-center gap-2 px-3 py-2.5 font-medium group">
          <Icon className="w-3.5 h-3.5 shrink-0 text-node-action" />
          <span className="flex-1 truncate">{data.label}</span>
          {data.costPerMonth > 0 && (
            <span className="text-muted-foreground tabular-nums text-2xs">€{data.costPerMonth}</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-[opacity,color,transform] duration-200 text-muted-foreground hover:text-foreground active:scale-90 nopan nodrag"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>
        {editing ? (
          <div className="px-3 pb-2 border-t border-border pt-1.5">
            <textarea
              ref={inputRef}
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); }
                if (e.key === "Escape") { setNoteValue(data.note || ""); setEditing(false); }
              }}
              placeholder="Scrivi una nota..."
              className="w-full bg-transparent text-2xs leading-tight resize-none outline-none min-h-[28px] text-foreground placeholder:text-muted-foreground nopan nodrag"
              rows={2}
            />
          </div>
        ) : (
          <div
            className="px-3 pb-2 text-2xs text-muted-foreground leading-tight border-t border-border pt-1.5 min-h-[22px] hover:text-foreground transition-colors duration-150 cursor-pointer nopan nodrag"
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          >
            {data.note || <span className="italic opacity-50">Click per nota...</span>}
          </div>
        )}
        <Handle type="target" position={Position.Left} className="!bg-lime/60 !w-2 !h-2 !border !border-lime/30" />
        <Handle type="source" position={Position.Right} className="!bg-lime/60 !w-2 !h-2 !border !border-lime/30" />
        <Handle type="source" id="bottom-source" position={Position.Bottom} className="!bg-node-action !w-2 !h-2 !border-2 !border-background !opacity-0" />
        <Handle type="target" id="top-target" position={Position.Top} className="!bg-node-action !w-2 !h-2 !border-2 !border-background !opacity-0" />
        <Handle type="source" id="top-source" position={Position.Top} className="!bg-node-action !w-2 !h-2 !border-2 !border-background !opacity-0" />
        <Handle type="target" id="bottom-target" position={Position.Bottom} className="!bg-node-action !w-2 !h-2 !border-2 !border-background !opacity-0" />
      </div>
    </>
  );
}
