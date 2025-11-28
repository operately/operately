import { useEffect, useRef, useState } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { BoardLocation, BoardMove, OnBoardMove } from "./types";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

export function useBoardDnD(onBoardMove: OnBoardMove) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const sourceLocationRef = useRef<BoardLocation | null>(null);

  useEffect(() => {
    return monitorForElements({
      onDragStart: ({ source }) => {
        const itemId = source.data.itemId as string;
        const containerId = source.data.containerId as string | undefined;
        const index = source.data.index;

        setDraggedItemId(itemId);

        if (!containerId || !isNumber(index)) {
          sourceLocationRef.current = null;
          return;
        }

        sourceLocationRef.current = { containerId, index };
      },
      onDrop: ({ source, location }) => {
        setDraggedItemId(null);

        const sourceLocation = sourceLocationRef.current;
        sourceLocationRef.current = null;

        if (!sourceLocation) return;

        const dropTargets = location.current.dropTargets;
        const target =
          dropTargets.find((candidate) => typeof candidate.data.itemId === "string" && typeof candidate.data.containerId === "string") ||
          dropTargets.find((candidate) => typeof candidate.data.containerId === "string");

        if (!target) return;

        const destinationContainerId = target.data.containerId as string;
        const targetIndex = isNumber(target.data.index) ? target.data.index : sourceLocation.index;
        let destinationIndex = targetIndex;

        const closestEdge = extractClosestEdge(target.data);
        if (closestEdge === "bottom") {
          destinationIndex += 1;
        }

        if (destinationContainerId === sourceLocation.containerId && sourceLocation.index < destinationIndex) {
          destinationIndex -= 1;
        }

        if (destinationContainerId === sourceLocation.containerId && destinationIndex === sourceLocation.index) {
          return;
        }

        const move: BoardMove = {
          itemId: source.data.itemId as string,
          source: sourceLocation,
          destination: {
            containerId: destinationContainerId,
            index: destinationIndex,
          },
        };

        onBoardMove(move);
      },
    });
  }, [onBoardMove]);

  return {
    draggedItemId,
  };
}
