import { useState, useCallback } from "react";
import {
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { Plus, Clock } from "lucide-react";

interface InsertableEdgeData {
  connectionId?: string;
  onInsertClick?: (connectionId: string, x: number, y: number) => void;
  [key: string]: unknown;
}

export function InsertableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  label,
  data,
}: EdgeProps<InsertableEdgeData>) {
  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const connectionId = data?.connectionId || id;
    data?.onInsertClick?.(connectionId, e.clientX, e.clientY);
  }, [data, id]);

  const limeColor = "hsl(73 100% 53%)";
  const baseColor = (style?.stroke as string) || limeColor;
  const strokeColor = hovered ? limeColor : baseColor;
  const markerId = `arrow-${id.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <>
      {/* Arrow marker definition */}
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 1 1 L 7 4 L 1 7"
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>

      {/* Invisible wide hit area */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      {/* Animated pulsing edge (background glow) */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={hovered ? 3 : 2}
        strokeOpacity={0.15}
        style={{ filter: "blur(3px)" }}
      />

      {/* Main visible edge with flowing dash animation */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={hovered ? 2.5 : 1.5}
        strokeDasharray="6 4"
        markerEnd={`url(#${markerId})`}
        style={{
          transition: "stroke 0.15s ease, stroke-width 0.15s ease",
          animation: "edge-flow 1s linear infinite",
        }}
      />

      {/* Label */}
      {label && (
        <foreignObject
          x={labelX - 60}
          y={labelY - 22}
          width={120}
          height={24}
          className="pointer-events-none"
        >
          <div className="flex items-center justify-center gap-1 w-full">
            <span className="inline-flex items-center gap-1 bg-muted/60 rounded-full px-2 py-0.5 text-3xs font-mono text-muted-foreground whitespace-nowrap">
              {typeof label === "string" && label.toLowerCase().startsWith("attend") && (
                <Clock className="w-2.5 h-2.5 shrink-0" />
              )}
              {label as string}
            </span>
          </div>
        </foreignObject>
      )}

      {/* Insert button */}
      {hovered && (
        <foreignObject
          x={labelX - 10}
          y={labelY - 10}
          width={20}
          height={20}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <button
            onClick={handleClick}
            className="w-5 h-5 rounded-full bg-card border border-lime/40 shadow-sm flex items-center justify-center hover:bg-muted hover:border-lime/70 transition-all duration-fast cursor-pointer animate-fade-in"
          >
            <Plus className="w-3 h-3 text-lime" />
          </button>
        </foreignObject>
      )}
    </>
  );
}
