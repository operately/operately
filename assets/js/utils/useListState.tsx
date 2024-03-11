import * as React from "react";

interface Id {
  id: string;
}

type Add<T> = (item: T) => void;
type Remove = (id: string) => void;
type Update = (id: string, field: string, value: any) => void;

type ListState<T> = [T[], { add: Add<T>; remove: Remove; update: Update }];

export function useListState<T extends Id>(initial: T[] | (() => T[])): ListState<T> {
  const [list, setList] = React.useState<T[]>(initial);

  const add = (item: T) => setList((prev) => [...prev, item]);
  const remove = (id: string) => setList((prev) => prev.filter((i) => i.id !== id));
  const update = (id: string, field: string, value: any) => {
    setList((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  return [list, { add, remove, update }];
}
