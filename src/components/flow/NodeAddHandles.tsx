import { Plus } from "lucide-react";

export type AddDirection = "right" | "left" | "top" | "bottom";

interface NodeAddHandlesProps {
  nodeId: string;
  onDirectionalAdd: (nodeId: string, direction: AddDirection, x: number, y: number) => void;
  /** Which handles to show. Defaults to all 4. */
  directions?: AddDirection[];
}

const POSITION_CLASSES: Record<AddDirection, string> = {
  right: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
  left: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
  top: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
  bottom: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
};

/**
 * Renders small "+" circles at node edges, visible on group-hover.
 * Must be placed inside a `group` container (the node wrapper).
 */
export function NodeAddHandles({
  nodeId,
  onDirectionalAdd,
  directions = ["right", "left", "top", "bottom"],
}: NodeAddHandlesProps) {
  return (
    <>
      {directions.map((dir) => (
        <button
          key={dir}
          onClick={(e) => {
            e.stopPropagation();
            onDirectionalAdd(nodeId, dir, e.clientX, e.clientY);
          }}
          className={`absolute z-10 w-5 h-5 rounded-full bg-lime text-background flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-fast hover:brightness-110 shadow-md focus-visible:ring-2 focus-visible:ring-lime/50 nopan nodrag ${POSITION_CLASSES[dir]}`}
          title={dir === "right" ? "Aggiungi dopo" : dir === "left" ? "Inserisci prima" : "Crea diramazione"}
        >
          <Plus className="w-3 h-3" strokeWidth={2.5} />
        </button>
      ))}
    </>
  );
}
