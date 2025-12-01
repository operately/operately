import { useEffect, useRef, useState } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { ElementEventPayloadMap } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { BoardLocation, BoardMove, OnBoardMove } from "./types";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

const EDGE_ZONE_MIN_PX = 16;
const EDGE_ZONE_MAX_PX = 64;
const EDGE_ZONE_RATIO = 0.1;

export function useBoardDnD(onBoardMove: OnBoardMove) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [sourceLocation, setSourceLocation] = useState<BoardLocation | null>(null);
  const [targetLocation, setTargetLocation] = useState<BoardLocation | null>(null);
  const [draggedItemDimensions, setDraggedItemDimensions] = useState<{ width: number; height: number } | null>(null);
  const sourceLocationRef = useRef<BoardLocation | null>(null);
  const lastDestinationRef = useRef<BoardLocation | null>(null);

  const clearDragState = () => {
    setDraggedItemId(null);
    setSourceLocation(null);
    setTargetLocation(null);
    setDraggedItemDimensions(null);
    sourceLocationRef.current = null;
    lastDestinationRef.current = null;
  };

  const getDestination = (
    location: ElementEventPayloadMap["onDrop"]["location"],
    sourceLocation: BoardLocation | null = sourceLocationRef.current,
  ) => {
    if (!sourceLocation) return null;

    const dropTargets = location.current.dropTargets;
    const target =
      dropTargets.find((candidate) => typeof candidate.data.itemId === "string" && typeof candidate.data.containerId === "string") ||
      dropTargets.find((candidate) => typeof candidate.data.containerId === "string");

    if (!target) return null;

    const destinationContainerId = target.data.containerId as string;
    const targetIndex = isNumber(target.data.index) ? target.data.index : sourceLocation.index;
    let destinationIndex = targetIndex;

    const closestEdge = extractClosestEdge(target.data);
    if (closestEdge === "bottom") {
      destinationIndex += 1;
    }

    return {
      containerId: destinationContainerId,
      index: Math.max(0, destinationIndex),
    };
  };

  const setDestination = (destination: BoardLocation) => {
    lastDestinationRef.current = destination;
    setTargetLocation((previous) => {
      if (previous && previous.containerId === destination.containerId && previous.index === destination.index) {
        return previous;
      }
      return destination;
    });
  };

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

        const location = { containerId, index };

        sourceLocationRef.current = location;
        lastDestinationRef.current = location;
        setSourceLocation(location);
        setTargetLocation(location);

        const rect = source.element.getBoundingClientRect();
        setDraggedItemDimensions({ width: rect.width, height: rect.height });
      },
      onDropTargetChange: ({ location }) => {
        const dropTargets = location.current.dropTargets;
        const itemTarget = dropTargets.find(
          (candidate) => typeof candidate.data.itemId === "string" && typeof candidate.data.containerId === "string",
        );
        const containerTarget = dropTargets.find(
          (candidate) => typeof candidate.data.containerId === "string" && typeof candidate.data.itemId !== "string",
        );

        if (itemTarget) {
          const destination = getDestination(location, sourceLocationRef.current);
          if (destination) {
            setDestination(destination);
          }
          return;
        }

        if (!containerTarget) {
          // Fall back to the last known destination to avoid jumping when between targets
          if (lastDestinationRef.current) {
            setTargetLocation(lastDestinationRef.current);
          }
          return;
        }

        const containerId = containerTarget.data.containerId as string;
        const containerLength = isNumber(containerTarget.data.index) ? containerTarget.data.index : 0;
        const pointerY = location.current.input.clientY;
        const rect = containerTarget.element.getBoundingClientRect();
        const edgeSize = Math.min(EDGE_ZONE_MAX_PX, Math.max(EDGE_ZONE_MIN_PX, rect.height * EDGE_ZONE_RATIO));
        const nearTop = pointerY <= rect.top + edgeSize;
        const nearBottom = pointerY >= rect.bottom - edgeSize;
        const isNewContainer = !lastDestinationRef.current || lastDestinationRef.current.containerId !== containerId;

        if (nearTop) {
          setDestination({ containerId, index: 0 });
          return;
        }

        if (nearBottom) {
          setDestination({ containerId, index: containerLength });
          return;
        }

        if (isNewContainer) {
          const middle = rect.top + rect.height / 2;
          const index = pointerY < middle ? 0 : containerLength;

          setDestination({ containerId, index });
          return;
        }

        // In the middle area without an item target: keep the last known destination to avoid bouncing to bottom
        if (lastDestinationRef.current) {
          setTargetLocation(lastDestinationRef.current);
        }
      },
      onDrop: ({ source, location }) => {
        const sourceLocation = sourceLocationRef.current;
        const liveDestination = getDestination(location, sourceLocation);
        const destination = liveDestination || lastDestinationRef.current;

        sourceLocationRef.current = null;
        lastDestinationRef.current = null;

        clearDragState();

        if (!sourceLocation || !destination) return;

        if (destination.containerId === sourceLocation.containerId && destination.index === sourceLocation.index) {
          return;
        }

        const move: BoardMove = {
          itemId: source.data.itemId as string,
          source: sourceLocation,
          destination,
        };

        onBoardMove(move);
      },
    });
  }, [onBoardMove]);

  return {
    draggedItemId,
    sourceLocation,
    targetLocation,
    draggedItemDimensions,
  };
}
