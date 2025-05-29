import * as React from "react";

interface ListActions<T> {
  update: (id: string, updater: (item: T) => T) => void;
  remove: (id: string) => T | null;
  reorder: (id: string, newIndex: number) => void;
  append: (item: T) => void;

  updateAll: (items: T[]) => void;
}

export function useListState<T extends { id: string; index: number }>(initialState: () => T[]): [T[], ListActions<T>] {
  const [list, setList] = React.useState<T[]>(initialState);

  const actions = {
    update: (id: string, updater: (item: T) => T) => {
      setList((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
    },

    remove: (id: string) => {
      const item = list.find((item) => item.id === id);

      setList((prev) => prev.filter((item) => item.id !== id));

      return item || null;
    },

    updateAll: (items: T[]) => {
      setList(items);
    },

    reorder: (id: string, newIndex: number) => {
      setList((prev) => {
        const item = prev.find((item) => item.id === id);
        if (!item) return prev;

        const newList = prev.filter((item) => item.id !== id);
        const newItem = { ...item, index: newIndex };
        newList.splice(newIndex, 0, newItem);
        newList.forEach((item, idx) => (item.index = idx));
        return newList;
      });
    },

    append: (item: T) => {
      setList((prev) => {
        const newItem = { ...item, index: prev.length };
        return [...prev, newItem];
      });
    },
  };

  return [list, actions];
}
