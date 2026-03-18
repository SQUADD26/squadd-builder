import { useState, useCallback, useRef, useEffect } from "react";
import { interpretEdgeConfig } from "@/lib/ai";
import { getApiKey } from "@/components/SettingsDialog";
import { Loader2, Sparkles, Plus, X, Clock, GitFork, ArrowRight, CornerDownLeft } from "lucide-react";
import { BRANCH_COLORS } from "@/data/flowTypes";
import { StepPickerContent } from "@/components/flow/StepPickerContent";

type Phase = "pick" | "wait-input" | "condition-input" | "step-picker";

interface EdgeActionPopoverProps {
  onConfirmWait: (label: string) => void;
  onConfirmCondition: (branches: { label: string }[], conditionLabel?: string) => void;
  onSelectTemplate: (templateId: string) => void;
  onSelectCondition: (question: string) => void;
  onSelectParallel: () => void;
  onCancel: () => void;
}

export function EdgeActionPopover({
  onConfirmWait,
  onConfirmCondition,
  onSelectTemplate,
  onSelectCondition,
  onSelectParallel,
  onCancel,
}: EdgeActionPopoverProps) {
  const [phase, setPhase] = useState<Phase>("pick");
  const [waitLabel, setWaitLabel] = useState("Attendi risposta");
  const [pendingWaitLabel, setPendingWaitLabel] = useState<string | null>(null);
  const [condLabel, setCondLabel] = useState("Condizione");
  const [branches, setBranches] = useState<{ label: string }[]>([
    { label: "Sì" },
    { label: "No" },
  ]);
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const waitInputRef = useRef<HTMLInputElement>(null);
  const condInputRef = useRef<HTMLInputElement>(null);

  const hasApiKey = !!getApiKey();

  useEffect(() => {
    if (phase === "wait-input") {
      setTimeout(() => {
        waitInputRef.current?.focus();
        waitInputRef.current?.select();
      }, 50);
    } else if (phase === "condition-input") {
      setTimeout(() => {
        condInputRef.current?.focus();
        condInputRef.current?.select();
      }, 50);
    }
  }, [phase]);

  const handleAi = useCallback(async () => {
    if (!aiQuery.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const result = await interpretEdgeConfig(aiQuery.trim());
      if (result.type === "wait") {
        setWaitLabel(result.label || "Attendi risposta");
        setPhase("wait-input");
      } else if (result.type === "condition" && result.branches) {
        setBranches(result.branches.map(b => ({ label: b.label })));
        setCondLabel(aiQuery.trim());
        setPhase("condition-input");
      } else {
        // direct → go straight to step picker
        setPhase("step-picker");
      }
    } catch {
      setPhase("step-picker");
    } finally {
      setAiLoading(false);
    }
  }, [aiQuery, aiLoading]);

  // ── Phase: Pick ─────────────────────────────────────────
  if (phase === "pick") {
    return (
      <div className="p-1.5 font-mono">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setPhase("step-picker")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[11px] text-foreground hover:bg-lime/10 transition-colors duration-fast"
          >
            <ArrowRight className="w-3.5 h-3.5 text-lime" />
            Diretto
          </button>
          <button
            onClick={() => setPhase("wait-input")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[11px] text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors duration-fast"
          >
            <Clock className="w-3.5 h-3.5" />
            Attesa
          </button>
          <button
            onClick={() => setPhase("condition-input")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[11px] text-node-condition hover:bg-muted/50 transition-colors duration-fast"
          >
            <GitFork className="w-3.5 h-3.5" />
            Condizione
          </button>
        </div>
        {hasApiKey && (
          <div className="border-t border-border/50 mt-1 pt-1 px-1 pb-0.5">
            <div className="flex items-center gap-1.5">
              {aiLoading ? (
                <Loader2 className="w-2.5 h-2.5 text-primary/40 animate-spin shrink-0" />
              ) : (
                <Sparkles className="w-2.5 h-2.5 text-primary/40 shrink-0" />
              )}
              <input
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Es: attendi risposta, se apre manda email..."
                disabled={aiLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleAi(); }
                  if (e.key === "Escape") onCancel();
                }}
                className="flex-1 bg-transparent text-[9px] font-mono text-muted-foreground/60 placeholder:text-muted-foreground/40 outline-none disabled:opacity-50"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Phase: Wait Input ───────────────────────────────────
  if (phase === "wait-input") {
    const confirmWait = () => {
      const label = waitLabel.trim() || "Attendi risposta";
      setPendingWaitLabel(label);
      onConfirmWait(label);
      setPhase("step-picker");
    };

    return (
      <div className="w-[260px] p-2 font-mono">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            ref={waitInputRef}
            value={waitLabel}
            onChange={(e) => setWaitLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); confirmWait(); }
              if (e.key === "Escape") onCancel();
            }}
            className="flex-1 bg-muted/50 border border-border rounded-md px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-lime/30"
          />
          <CornerDownLeft className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        </div>
        <p className="text-[9px] text-muted-foreground/40 mt-1.5 px-0.5">Invio per confermare e aggiungere step</p>
      </div>
    );
  }

  // ── Phase: Condition Input ──────────────────────────────
  if (phase === "condition-input") {
    const addBranch = () => {
      setBranches(prev => [...prev, { label: `Ramo ${prev.length + 1}` }]);
    };
    const removeBranch = (idx: number) => {
      if (branches.length <= 2) return;
      setBranches(prev => prev.filter((_, i) => i !== idx));
    };
    const updateBranch = (idx: number, label: string) => {
      setBranches(prev => prev.map((b, i) => i === idx ? { label } : b));
    };

    const handleConfirm = () => {
      const valid = branches.filter(b => b.label.trim());
      if (valid.length >= 2) {
        onConfirmCondition(valid, condLabel.trim() || undefined);
      }
    };

    return (
      <div className="w-[260px] p-2 font-mono space-y-2">
        <div className="flex items-center gap-2">
          <GitFork className="w-3.5 h-3.5 text-node-condition shrink-0" />
          <input
            ref={condInputRef}
            value={condLabel}
            onChange={(e) => setCondLabel(e.target.value)}
            placeholder="Condizione..."
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleConfirm(); }
              if (e.key === "Escape") onCancel();
            }}
            className="flex-1 bg-muted/50 border border-border rounded-md px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-lime/30"
          />
          <CornerDownLeft className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        </div>
        <div className="border-t border-border/50 pt-2 space-y-1">
          {branches.map((b, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length] }}
              />
              <input
                value={b.label}
                onChange={(e) => updateBranch(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleConfirm(); }
                  if (e.key === "Escape") onCancel();
                }}
                className="flex-1 bg-transparent border-b border-border/50 px-1 py-0.5 text-[11px] font-mono focus:outline-none focus:border-muted-foreground/50"
              />
              {branches.length > 2 && (
                <button
                  onClick={() => removeBranch(i)}
                  className="text-muted-foreground/40 hover:text-destructive transition-colors duration-fast"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addBranch}
            className="flex items-center gap-1 text-3xs text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-fast mt-1"
          >
            <Plus className="w-2.5 h-2.5" />
            Aggiungi ramo
          </button>
        </div>
      </div>
    );
  }

  // ── Phase: Step Picker ──────────────────────────────────
  return (
    <StepPickerContent
      onSelectTemplate={onSelectTemplate}
      onSelectCondition={onSelectCondition}
      onSelectParallel={onSelectParallel}
    />
  );
}
