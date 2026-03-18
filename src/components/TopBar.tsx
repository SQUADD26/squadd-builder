import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Monitor, Share2, PanelRightClose, PanelRightOpen, Undo2, Redo2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "motion/react";

interface TopBarProps {
  onPresent?: () => void;
  onShare?: () => void;
  hasFlow?: boolean;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  lastSaved?: Date | null;
}

export function TopBar({ onPresent, onShare, hasFlow, sidebarOpen, onToggleSidebar, onUndo, onRedo, canUndo, canRedo, lastSaved }: TopBarProps) {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!lastSaved) return;
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [lastSaved]);

  return (
    <div className="h-14 border-b border-border flex items-center px-4 gap-4 bg-card shrink-0">
      <div className="flex items-center gap-2">
        <img src="/squadd-logo.svg" alt="Squadd" className="h-14" />
      </div>

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo} className="h-8 w-8">
              <Undo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Annulla (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo} className="h-8 w-8">
              <Redo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ripeti (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>
        <AnimatePresence>
          {showSaved && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="font-mono text-2xs text-muted-foreground ml-1"
            >
              Salvato
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1" />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {hasFlow && (
          <>
            <Button
              onClick={onPresent}
              className="font-mono text-xs h-9 px-5 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider"
            >
              <Monitor className="w-4 h-4" />
              Presenta
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onShare} className="h-8 w-8">
                  <Share2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copia link condivisibile</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-8 w-8">
            {sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{sidebarOpen ? "Chiudi pannello" : "Apri pannello"}</TooltipContent>
      </Tooltip>
    </div>
  );
}
