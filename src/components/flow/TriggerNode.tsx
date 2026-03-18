import { useState, useRef, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import { Plus, Zap } from "lucide-react";
import { SOURCE_TEMPLATES } from "@/data/templates";
import { SOURCE_ICON_MAP } from "./iconMaps";
import { motion, AnimatePresence } from "motion/react";

export function TriggerNode({ data }: { data: any }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    // Use capture phase to intercept before ReactFlow stops propagation
    const timer = setTimeout(() => document.addEventListener("pointerdown", handler, true), 0);
    return () => { clearTimeout(timer); document.removeEventListener("pointerdown", handler, true); };
  }, [pickerOpen]);

  const hasSources = data.sourceCount > 0;

  return (
    <div ref={ref} className="relative">
      {/* Compact trigger button */}
      <button
        onClick={() => setPickerOpen(prev => !prev)}
        className={`group flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 font-mono text-[11px] cursor-pointer transition-all duration-150 nopan nodrag ${
          hasSources
            ? "border-lime/20 bg-card/60 hover:border-lime/40 hover:bg-card/80 min-w-0"
            : "border-lime/30 bg-card/80 hover:border-lime/50 hover:bg-card min-w-[180px]"
        }`}
      >
        <div className={`rounded-md flex items-center justify-center shrink-0 ${
          hasSources ? "w-5 h-5 bg-lime/10" : "w-6 h-6 bg-lime/15"
        }`}>
          <Plus className={`text-lime ${hasSources ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
        </div>
        {hasSources ? (
          <span className="text-muted-foreground/70 whitespace-nowrap">Aggiungi fonte</span>
        ) : (
          <div>
            <span className="text-foreground/80 font-medium">Aggiungi trigger</span>
            <p className="text-[9px] text-muted-foreground/50 mt-0.5">Da dove arrivano i contatti?</p>
          </div>
        )}
      </button>

      {/* Source picker popover */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-2 z-50 bg-card border border-border rounded-lg shadow-lg nopan nodrag"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="w-[220px] p-1.5 font-mono">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 px-2 py-1 mb-0.5">
                Fonti
              </p>
              {SOURCE_TEMPLATES.map((t) => {
                const Icon = SOURCE_ICON_MAP[t.icon] || Zap;
                const isActive = data.activeSources?.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      data.onSelectSource?.(t.id);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-left transition-colors duration-150 ${
                      isActive
                        ? "bg-lime/10 text-lime"
                        : "text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1">{t.label}</span>
                    {isActive && (
                      <span className="text-[9px] text-lime/60">attivo</span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden handle for edge connections — only used when no sources */}
      {!hasSources && (
        <Handle type="source" position={Position.Right} className="!bg-lime/60 !w-2 !h-2 !border !border-lime/30" />
      )}
    </div>
  );
}
