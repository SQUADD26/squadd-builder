import { useState } from "react";
import { ArrowRight, ArrowLeft, ArrowUp, ArrowDown, GitFork, Zap, Plus, X } from "lucide-react";
import { StepPickerContent } from "./StepPickerContent";
import { BRANCH_COLORS } from "@/data/flowTypes";
import type { AddDirection } from "./NodeAddHandles";

type Phase = "pick-type" | "step-picker" | "branch-config";

interface DirectionalPickerContentProps {
  direction: AddDirection;
  onSelectTemplate: (templateId: string) => void;
  onSelectCondition: (question: string) => void;
  onSelectParallel: () => void;
  onSelectBranch?: (branches: { label: string }[], conditionLabel?: string) => void;
}

const DIRECTION_LABELS: Record<AddDirection, { label: string; icon: typeof ArrowRight }> = {
  right: { label: "Dopo", icon: ArrowRight },
  left: { label: "Prima", icon: ArrowLeft },
  top: { label: "Diramazione sopra", icon: ArrowUp },
  bottom: { label: "Diramazione sotto", icon: ArrowDown },
};

export function DirectionalPickerContent({
  direction,
  onSelectTemplate,
  onSelectCondition,
  onSelectParallel,
  onSelectBranch,
}: DirectionalPickerContentProps) {
  const [phase, setPhase] = useState<Phase>("pick-type");

  const dirInfo = DIRECTION_LABELS[direction];
  const DirIcon = dirInfo.icon;

  if (phase === "pick-type") {
    return (
      <div className="w-[220px] p-1.5 font-mono">
        {/* Direction indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 mb-1">
          <DirIcon className="w-3 h-3 text-lime" />
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60">
            {dirInfo.label}
          </span>
        </div>

        {/* Type selection: Azione or Ramificazione */}
        <div className="space-y-0.5">
          <button
            onClick={() => setPhase("step-picker")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[11px] text-foreground hover:bg-lime/10 transition-colors duration-150 text-left"
          >
            <Zap className="w-3.5 h-3.5 text-lime" />
            Azione
          </button>

          <button
            onClick={() => setPhase("branch-config")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[11px] text-foreground hover:bg-orange-400/10 transition-colors duration-150 text-left"
          >
            <GitFork className="w-3.5 h-3.5 text-orange-400" />
            Ramificazione
          </button>
        </div>
      </div>
    );
  }

  if (phase === "branch-config") {
    return (
      <BranchConfigurator
        onConfirm={(branches, label) => {
          if (onSelectBranch) {
            onSelectBranch(branches, label);
          } else {
            // Fallback: create as smart-condition via onSelectCondition
            onSelectCondition(label || "Condizione");
          }
        }}
      />
    );
  }

  // Phase: step-picker
  return (
    <StepPickerContent
      onSelectTemplate={onSelectTemplate}
      onSelectCondition={onSelectCondition}
      onSelectParallel={onSelectParallel}
    />
  );
}

/** Branch configurator: set label + branch names */
function BranchConfigurator({
  onConfirm,
}: {
  onConfirm: (branches: { label: string }[], conditionLabel?: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [branches, setBranches] = useState([
    { label: "Sì" },
    { label: "No" },
  ]);

  const labelRef = useState<HTMLInputElement | null>(null);

  const addBranch = () => {
    setBranches(prev => [...prev, { label: `Ramo ${prev.length + 1}` }]);
  };

  const removeBranch = (idx: number) => {
    if (branches.length <= 2) return;
    setBranches(prev => prev.filter((_, i) => i !== idx));
  };

  const updateBranch = (idx: number, value: string) => {
    setBranches(prev => prev.map((b, i) => i === idx ? { label: value } : b));
  };

  const handleConfirm = () => {
    const valid = branches.filter(b => b.label.trim());
    if (valid.length >= 2) {
      onConfirm(valid, label.trim() || undefined);
    }
  };

  return (
    <div className="w-[260px] p-3 font-mono space-y-2.5" onMouseDown={(e) => e.stopPropagation()}>
      {/* Condition label */}
      <div className="space-y-1">
        <label className="text-[9px] uppercase tracking-widest text-muted-foreground/60">
          Nome (opzionale)
        </label>
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); handleConfirm(); }
          }}
          placeholder="Es: Il cliente risponde?"
          className="w-full bg-muted/50 border border-border rounded-md px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-lime/30"
        />
      </div>

      {/* Branches */}
      <div className="space-y-1">
        <label className="text-[9px] uppercase tracking-widest text-muted-foreground/60">
          Rami
        </label>
        {branches.map((b, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length] }}
            />
            <input
              value={b.label}
              onChange={(e) => updateBranch(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleConfirm(); }
              }}
              className="flex-1 bg-muted/50 border border-border/50 rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-muted-foreground/50"
            />
            {branches.length > 2 && (
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); removeBranch(i); }}
                className="text-muted-foreground/40 hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); addBranch(); }}
          className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors mt-1 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          Aggiungi ramo
        </button>
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        className="w-full py-1.5 rounded-md bg-lime/15 text-lime text-[11px] font-mono hover:bg-lime/25 transition-colors"
      >
        Crea ramificazione
      </button>
    </div>
  );
}
