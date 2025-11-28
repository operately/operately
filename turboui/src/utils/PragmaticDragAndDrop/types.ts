export interface DraggableItem {
  id: string;
  index: number;
  containerId?: string;
}

export type OnReorderFunction = (itemId: string, newIndex: number) => void | Promise<void>;

export interface BoardLocation {
  containerId: string;
  index: number;
}

export interface BoardMove {
  itemId: string;
  source: BoardLocation;
  destination: BoardLocation;
}

export type OnBoardMove = (move: BoardMove) => void | Promise<void>;
