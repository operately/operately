import { useEffect, useRef, useState } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { ElementEventPayloadMap } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { BoardLocation, OnBoardMove } from "./types";

const EDGE_ZONE_MIN_PX = 16;
const EDGE_ZONE_MAX_PX = 64;
const EDGE_ZONE_RATIO = 0.1;

type DestinationInput = {
  location: ElementEventPayloadMap["onDrop"]["location"];
  source: BoardLocation | null;
  lastDestination: BoardLocation | null;
  isMovingDown: boolean;
};

export function useBoardDnD(onBoardMove: OnBoardMove) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [sourceLocation, setSourceLocation] = useState<BoardLocation | null>(null);
  const [destination, setDestinationState] = useState<BoardLocation | null>(null);
  const [draggedItemDimensions, setDraggedItemDimensions] = useState<{ width: number; height: number } | null>(null);
  const sourceLocationRef = useRef<BoardLocation | null>(null);
  const destinationRef = useRef<BoardLocation | null>(null);
  const lastIsMovingDownRef = useRef<boolean>(true);
  const lastClientYRef = useRef<number | null>(null);

  const setDestination = (next: BoardLocation | null) => {
    destinationRef.current = next;
    setDestinationState((prev) => {
      if (prev && next && prev.containerId === next.containerId && prev.index === next.index) {
        return prev;
      }
      return next;
    });
  };

  const clearDragState = () => {
    setDraggedItemId(null);
    setSourceLocation(null);
    setDestinationState(null);
    setDraggedItemDimensions(null);
    sourceLocationRef.current = null;
    destinationRef.current = null;
    lastIsMovingDownRef.current = true;
    lastClientYRef.current = null;
  };

  useEffect(() => {
    return monitorForElements({
      onDragStart: ({ source, location }) => {
        const scope = source.data.scope as string | undefined;
        if (typeof scope === "string") {
          // Ignore drags that belong to other drag scopes, such as status column sorting
          return;
        }

        const itemId = source.data.itemId as string;
        const containerId = source.data.containerId as string | undefined;
        const index = source.data.index;

        setDraggedItemId(itemId);

        if (!containerId || !isNumber(index)) {
          sourceLocationRef.current = null;
          return;
        }

        const loc = { containerId, index };

        sourceLocationRef.current = loc;
        setSourceLocation(loc);
        setDestination(loc);

        const rect = source.element.getBoundingClientRect();
        setDraggedItemDimensions({ width: rect.width, height: rect.height });

        lastClientYRef.current = location.current.input.clientY;
      },
      onDrag: ({ location }) => {
        const currentY = location.current.input.clientY;

        if (lastClientYRef.current !== null) {
          const diff = currentY - lastClientYRef.current;
          if (Math.abs(diff) >= 2) {
            lastIsMovingDownRef.current = diff > 0;
            lastClientYRef.current = currentY;
          }
        } else {
          lastClientYRef.current = currentY;
        }

        const destination = computeDestination({
          location,
          source: sourceLocationRef.current,
          lastDestination: destinationRef.current,
          isMovingDown: lastIsMovingDownRef.current,
        });

        if (destination) {
          setDestination(destination);
        }
      },
      onDropTargetChange: ({ location }) => {
        const destination = computeDestination({
          location,
          source: sourceLocationRef.current,
          lastDestination: destinationRef.current,
          isMovingDown: lastIsMovingDownRef.current,
        });

        if (destination) {
          setDestination(destination);
        }
      },
      onDrop: ({ source, location }) => {
        const sourceLocation = sourceLocationRef.current;
        const liveDestination = computeDestination({
          location,
          source: sourceLocation,
          lastDestination: destinationRef.current,
          isMovingDown: lastIsMovingDownRef.current,
        });

        const finalDestination = liveDestination || destinationRef.current;

        clearDragState();

        if (!sourceLocation || !finalDestination) return;

        if (
          finalDestination.containerId === sourceLocation.containerId &&
          finalDestination.index === sourceLocation.index
        ) {
          return;
        }

        onBoardMove({
          itemId: source.data.itemId as string,
          source: sourceLocation,
          destination: finalDestination,
        });
      },
    });
  }, [onBoardMove]);

  return {
    draggedItemId,
    sourceLocation,
    destination,
    draggedItemDimensions,
  };
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

function hasClientY(input: unknown): input is { clientY: number } {
  return (
    typeof input === "object" &&
    input !== null &&
    "clientY" in input &&
    typeof (input as { clientY: unknown }).clientY === "number"
  );
}

function computeDestination({
  location,
  source,
  lastDestination,
  isMovingDown,
}: DestinationInput): BoardLocation | null {
  if (!source) return null;

  const dropTargets = location.current.dropTargets;
  const itemTarget = dropTargets.find(
    (candidate) =>
      typeof candidate.data.itemId === "string" &&
      typeof candidate.data.containerId === "string" &&
      typeof candidate.data.scope !== "string",
  );
  const containerTarget = dropTargets.find(
    (candidate) =>
      typeof candidate.data.containerId === "string" &&
      typeof candidate.data.itemId !== "string" &&
      !candidate.data.isPlaceholder &&
      typeof candidate.data.scope !== "string",
  );

  if (itemTarget) {
    return getItemDestination(location, source, itemTarget, isMovingDown);
  }

  if (!containerTarget) {
    return lastDestination;
  }

  return getContainerDestination(location, containerTarget, lastDestination);
}

function getContainerDestination(
  location: ElementEventPayloadMap["onDrop"]["location"],
  containerTarget: ElementEventPayloadMap["onDrop"]["location"]["current"]["dropTargets"][number],
  lastDestination: BoardLocation | null,
): BoardLocation | null {
  const containerId = containerTarget.data.containerId as string;
  const containerLength = isNumber(containerTarget.data.index) ? containerTarget.data.index : 0;
  const pointerY = location.current.input.clientY;
  const rect = containerTarget.element.getBoundingClientRect();
  const edgeSize = Math.min(EDGE_ZONE_MAX_PX, Math.max(EDGE_ZONE_MIN_PX, rect.height * EDGE_ZONE_RATIO));
  const nearTop = pointerY <= rect.top + edgeSize;
  const nearBottom = pointerY >= rect.bottom - edgeSize;
  const isNewContainer = !lastDestination || lastDestination.containerId !== containerId;

  if (nearTop) return { containerId, index: 0 };
  if (nearBottom) return { containerId, index: containerLength };
  if (isNewContainer) {
    const middle = rect.top + rect.height / 2;
    const index = pointerY < middle ? 0 : containerLength;
    return { containerId, index };
  }

  return lastDestination;
}

function getItemDestination(
  location: ElementEventPayloadMap["onDrop"]["location"],
  sourceLocation: BoardLocation,
  target: ElementEventPayloadMap["onDrop"]["location"]["current"]["dropTargets"][number],
  isMovingDown: boolean,
): BoardLocation {
  const destinationContainerId = target.data.containerId as string;
  const targetIndex = isNumber(target.data.index) ? target.data.index : sourceLocation.index;
  let destinationIndex = targetIndex;

  let closestEdge = extractClosestEdge(target.data);

  const input = location.current.input;
  if (hasClientY(input)) {
    const rect = target.element.getBoundingClientRect();
    if (rect.height > 0) {
      const relativeY = (input.clientY - rect.top) / rect.height;

      let threshold = 0.5;
      if (sourceLocation.containerId === destinationContainerId) {
        threshold = isMovingDown ? 0.1 : 0.9;
      }

      closestEdge = relativeY > threshold ? "bottom" : "top";
    }
  }

  if (closestEdge === "bottom") {
    destinationIndex += 1;
  }

  return {
    containerId: destinationContainerId,
    index: Math.max(0, destinationIndex),
  };
}
