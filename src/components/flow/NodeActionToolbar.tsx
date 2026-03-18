import { useState } from "react";
import { NodeToolbar, Position } from "@xyflow/react";
import { Plus, Pencil, Trash2, GitBranch } from "lucide-react";
import { StepPicker } from "./StepPicker";

interface NodeActionToolbarProps {
  nodeId: string;
  nodeType: "source" | "action" | "condition" | "parallel" | "converge";
  isVisible: boolean;
  onAddAfter?: (nodeId: string, templateId: string) => void;
  onAddConditionAfter?: (nodeId: string, question: string) => void;
  onAddParallelAfter?: (nodeId: string) => void;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  onAddBranch?: (nodeId: string) => void;
}

export function NodeActionToolbar({
  nodeId,
  nodeType,
  isVisible,
  onAddAfter,
  onAddConditionAfter,
  onAddParallelAfter,
  onEdit,
  onDelete,
  onAddBranch,
}: NodeActionToolbarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (nodeType === "converge") return null;

  const showAdd = nodeType !== "source";
  const showEdit = nodeType !== "source";
  const showBranch = nodeType === "condition" || nodeType === "parallel";

  return (
    <NodeToolbar
      isVisible={isVisible || pickerOpen}
      position={Position.Top}
      offset={8}
      className="!border-0 !bg-transparent !p-0 !shadow-none"
    >
      <div
        className="flex items-center gap-0.5 bg-card/95 backdrop-blur-sm border border-border rounded-full px-1.5 py-1 shadow-lg"
        style={{
          animation: isVisible ? "toolbar-in 120ms cubic-bezier(0.25, 0.1, 0.25, 1)" : undefined,
        }}
      >
        {showAdd && (
          <StepPicker
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            onSelectTemplate={(templateId) => onAddAfter?.(nodeId, templateId)}
            onSelectCondition={(q) => onAddConditionAfter?.(nodeId, q)}
            onSelectParallel={() => onAddParallelAfter?.(nodeId)}
            side="top"
            align="center"
          >
            <button
              className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-fast focus-visible:ring-2 focus-visible:ring-lime/50"
              title="Aggiungi dopo"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </StepPicker>
        )}

        {showBranch && (
          <button
            onClick={() => onAddBranch?.(nodeId)}
            className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-fast focus-visible:ring-2 focus-visible:ring-lime/50"
            title="Aggiungi branch"
          >
            <GitBranch className="w-3.5 h-3.5" />
          </button>
        )}

        {showEdit && (
          <button
            onClick={() => onEdit?.(nodeId)}
            className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-fast focus-visible:ring-2 focus-visible:ring-lime/50"
            title="Modifica"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={() => onDelete?.(nodeId)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-fast focus-visible:ring-2 focus-visible:ring-lime/50"
          title="Elimina"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </NodeToolbar>
  );
}
