import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { STEP_TEMPLATES } from "@/data/templates";
import { matchStepFromQuery } from "@/lib/ai";
import { getApiKey } from "@/components/SettingsDialog";
import { Zap, HelpCircle, GitBranch, Sparkles, Loader2, Search } from "lucide-react";
import { STEP_ICON_MAP } from "./iconMaps";

interface SmartStepSearchProps {
  onSelectTemplate: (templateId: string) => void;
  onSelectCondition: (question: string) => void;
  onSelectParallel: () => void;
}

const QUESTION_PATTERNS = /^(se |quando |il |la |ha |è |sono |viene |chi |cosa |come |dove |quale |quant)/i;

/** Simple fuzzy score: how well does `query` match `target`? Higher = better. */
function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // Exact substring
  if (t.includes(q)) return 100 + (q.length / t.length) * 50;

  // Word overlap
  const qWords = q.split(/\s+/);
  const tWords = t.split(/\s+/);
  let wordScore = 0;
  for (const qw of qWords) {
    for (const tw of tWords) {
      if (tw.includes(qw) || qw.includes(tw)) {
        wordScore += 20;
      } else if (tw.startsWith(qw.slice(0, 3)) && qw.length >= 3) {
        wordScore += 10;
      }
    }
  }
  if (wordScore > 0) return wordScore;

  // Character sequence matching (typo tolerance)
  let qi = 0;
  let matches = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) { matches++; qi++; }
  }
  return (matches / q.length) * 15;
}

function isQuestionLike(text: string): boolean {
  return text.includes("?") || QUESTION_PATTERNS.test(text.trim());
}

export function SmartStepSearch({
  onSelectTemplate,
  onSelectCondition,
  onSelectParallel,
}: SmartStepSearchProps) {
  const [query, setQuery] = useState("");
  const [aiResults, setAiResults] = useState<string[] | null>(null);
  const [aiCondition, setAiCondition] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const listRef = useRef<HTMLDivElement>(null);

  const hasApiKey = !!getApiKey();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Local fuzzy search
  const localResults = useMemo(() => {
    if (!query.trim()) return STEP_TEMPLATES;
    return STEP_TEMPLATES
      .map(t => ({ template: t, score: Math.max(fuzzyScore(query, t.label), fuzzyScore(query, t.category)) }))
      .filter(r => r.score > 5)
      .sort((a, b) => b.score - a.score)
      .map(r => r.template);
  }, [query]);

  // Detect condition-like input
  const looksLikeCondition = useMemo(() => {
    return query.trim().length > 3 && isQuestionLike(query);
  }, [query]);

  // AI search with debounce — only when local results are poor
  useEffect(() => {
    setAiResults(null);
    setAiCondition(null);

    if (!hasApiKey || query.trim().length < 3) return;
    if (localResults.length >= 3) return; // local search is good enough

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsAiLoading(true);
      try {
        const results = await matchStepFromQuery(query);
        if (results.length === 1 && results[0].startsWith("CONDITION:")) {
          setAiCondition(results[0].replace("CONDITION:", "").trim());
          setAiResults([]);
        } else {
          setAiResults(results);
          setAiCondition(null);
        }
      } finally {
        setIsAiLoading(false);
      }
    }, 600);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, hasApiKey, localResults.length]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Build the final display list
  const displayItems = useMemo(() => {
    const items: Array<{
      type: "template" | "condition" | "parallel" | "ai-condition" | "ai-header";
      id: string;
      label: string;
      icon?: string;
      isAi?: boolean;
    }> = [];

    // Condition suggestion if input looks like a question
    if (looksLikeCondition) {
      items.push({
        type: "condition",
        id: "__condition",
        label: `Condizione: "${query.trim()}"`,
      });
    }

    // AI-detected condition
    if (aiCondition) {
      items.push({
        type: "ai-condition",
        id: "__ai-condition",
        label: `Condizione: "${aiCondition}"`,
        isAi: true,
      });
    }

    // Local results
    const localIds = new Set(localResults.map(t => t.id));
    for (const t of localResults) {
      items.push({ type: "template", id: t.id, label: t.label, icon: t.icon });
    }

    // AI results (only those not already in local)
    if (aiResults) {
      const aiOnly = aiResults.filter(id => !localIds.has(id));
      if (aiOnly.length > 0) {
        items.push({ type: "ai-header", id: "__ai-header", label: "Suggeriti da AI" });
        for (const id of aiOnly) {
          const t = STEP_TEMPLATES.find(s => s.id === id);
          if (t) items.push({ type: "template", id: t.id, label: t.label, icon: t.icon, isAi: true });
        }
      }
    }

    // Always show parallel + condition at bottom if no query
    if (!query.trim()) {
      items.push({ type: "condition", id: "__condition-empty", label: "Condizione" });
      items.push({ type: "parallel", id: "__parallel", label: "Parallelo" });
    } else if (!looksLikeCondition) {
      items.push({ type: "parallel", id: "__parallel", label: "Parallelo" });
    }

    return items;
  }, [localResults, aiResults, aiCondition, looksLikeCondition, query]);

  const selectItem = useCallback((index: number) => {
    const item = displayItems[index];
    if (!item || item.type === "ai-header") return;

    if (item.type === "template") {
      onSelectTemplate(item.id);
    } else if (item.type === "condition") {
      const q = query.trim().replace(/\?$/, "").trim();
      onSelectCondition(q || "Nuova condizione");
    } else if (item.type === "ai-condition") {
      onSelectCondition(aiCondition || query.trim());
    } else if (item.type === "parallel") {
      onSelectParallel();
    }
  }, [displayItems, query, aiCondition, onSelectTemplate, onSelectCondition, onSelectParallel]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const selectableIndices = displayItems
      .map((item, i) => item.type !== "ai-header" ? i : -1)
      .filter(i => i !== -1);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const currentPos = selectableIndices.indexOf(selectedIndex);
      const nextPos = Math.min(currentPos + 1, selectableIndices.length - 1);
      setSelectedIndex(selectableIndices[nextPos]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const currentPos = selectableIndices.indexOf(selectedIndex);
      const nextPos = Math.max(currentPos - 1, 0);
      setSelectedIndex(selectableIndices[nextPos]);
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectItem(selectedIndex);
    }
  }, [displayItems, selectedIndex, selectItem]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <div className="w-[260px] flex flex-col">
      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Cerca o descrivi cosa vuoi..."
          className="flex-1 bg-transparent text-xs font-mono outline-none placeholder:text-muted-foreground/60"
        />
        {isAiLoading && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />}
        {hasApiKey && !isAiLoading && query.trim().length >= 3 && (
          <Sparkles className="w-3 h-3 text-primary/50 shrink-0" />
        )}
      </div>

      {/* Results list */}
      <div ref={listRef} className="max-h-[280px] overflow-auto p-1">
        {displayItems.length === 0 && (
          <p className="px-2 py-3 text-center font-mono text-[10px] text-muted-foreground">
            Nessun risultato
          </p>
        )}

        {displayItems.map((item, i) => {
          if (item.type === "ai-header") {
            return (
              <div key={item.id} className="flex items-center gap-1.5 px-2 pt-2 pb-1">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-primary">
                  {item.label}
                </span>
              </div>
            );
          }

          const isSelected = i === selectedIndex;
          const Icon = item.type === "condition" || item.type === "ai-condition"
            ? HelpCircle
            : item.type === "parallel"
              ? GitBranch
              : STEP_ICON_MAP[item.icon || ""] || Zap;
          const iconColor = item.type === "condition" || item.type === "ai-condition"
            ? "text-node-condition"
            : item.type === "parallel"
              ? "text-muted-foreground"
              : "text-muted-foreground";

          return (
            <button
              key={item.id}
              data-index={i}
              onClick={() => selectItem(i)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left font-mono text-[11px] transition-colors ${
                isSelected ? "bg-muted text-foreground" : "hover:bg-muted/50"
              }`}
            >
              <Icon className={`w-3 h-3 shrink-0 ${iconColor}`} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.isAi && <Sparkles className="w-2.5 h-2.5 text-primary/40 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* AI hint */}
      {hasApiKey && !query.trim() && (
        <div className="px-3 py-1.5 border-t border-border">
          <p className="font-mono text-[9px] text-muted-foreground/50 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            Scrivi qualsiasi cosa, l'AI capisce
          </p>
        </div>
      )}
    </div>
  );
}
