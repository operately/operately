import * as React from "react";

interface ListActions<T> {
  update: (id: string, updater: (item: T) => T) => void;
  remove: (id: string) => void;
  reorder: (id: string, newIndex: number) => void;

  updateAll: (items: T[]) => void;
}

export function useListState<T extends { id: string; index: number }>(initialState: () => T[]): [T[], ListActions<T>] {
  const [list, setList] = React.useState<T[]>(initialState);

  const update = (id: string, updater: (item: T) => T) => {
    setList((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  };

  const remove = (id: string) => {
    setList((prev) => prev.filter((item) => item.id !== id));
  };

  const updateAll = (items: T[]) => {
    setList(items);
  };

  const reorder = (id: string, newIndex: number) => {
    setList((prev) => {
      const item = prev.find((item) => item.id === id);
      if (!item) return prev;

      const newList = prev.filter((item) => item.id !== id);
      const newItem = { ...item, index: newIndex };
      newList.splice(newIndex, 0, newItem);
      newList.forEach((item, idx) => (item.index = idx));
      return newList;
    });
  };

  return [list, { update, remove, updateAll, reorder }];
}
