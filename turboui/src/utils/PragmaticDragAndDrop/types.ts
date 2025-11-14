export interface DraggableItem {
  id: string;
  index: number;
}

export type OnReorderFunction = (itemId: string, newIndex: number) => void | Promise<void>;
