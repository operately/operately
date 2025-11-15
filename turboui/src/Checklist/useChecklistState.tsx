import React from "react";
import { Checklist } from ".";

export type ChecklistItemState = Checklist.ChecklistItem & {
  editButtonVisible: boolean;
};

export interface State {
  items: ChecklistItemState[];
  togglable: boolean;

  addActive: boolean;

  addItem: (inputs: { name: string }) => Promise<boolean>;
  deleteItem: (id: string) => void;
  toggleItem: (id: string, completed: boolean) => void;

  startEdit: (id: string) => void;
  saveEdit: (id: string, inputs: { name: string }) => void;
  cancelEdit: (id: string) => void;

  cancelAdd: () => void;

  reorder: (draggedId: string, indexInDropZone: number) => void;
}

export function useChecklistState(props: Checklist.InternalProps): State {
  const [items, setItems] = React.useState<ChecklistItemState[]>(() =>
    props.items.map((item) => ({
      ...item,
      editButtonVisible: props.showEditButton || false,
    })),
  );

  const [addActive, setAddActive] = React.useState(props.addActive || false);

  React.useEffect(() => {
    setItems(
      props.items.map((item) => ({
        ...item,
        editButtonVisible: props.showEditButton || false,
      })),
    );
  }, [props.items, props.showEditButton]);

  React.useEffect(() => {
    setAddActive(props.addActive || false);
  }, [props.addActive]);

  React.useEffect(() => {
    if (props.onAddActiveChange) {
      props.onAddActiveChange(addActive);
    }
  }, [addActive, props.onAddActiveChange]);

  const addItem = async (inputs: { name: string }) => {
    const result = await props.addItem(inputs);
    if (result.success) {
      return true;
    }
    return false;
  };

  const deleteItem = async (id: string) => {
    const success = await props.deleteItem(id);
    if (success) {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, mode: "view" as const } : item)));
    }
  };

  const toggleItem = async (id: string, completed: boolean) => {
    await props.toggleItem(id, completed);
  };

  const startEdit = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, mode: "edit" as const } : item)));
  };

  const saveEdit = async (id: string, inputs: { name: string }) => {
    const success = await props.updateItem({ itemId: id, ...inputs });
    if (success) {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, mode: "view" as const } : item)));
    }
  };

  const cancelEdit = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, mode: "view" as const } : item)));
  };

  const cancelAdd = () => {
    setAddActive(false);
  };

  const reorder = (draggedId: string, indexInDropZone: number) => {
    const draggedItem = items.find((item) => item.id === draggedId);
    if (!draggedItem) return;

    const oldIndex = items.findIndex((item) => item.id === draggedId);
    if (oldIndex === -1 || oldIndex === indexInDropZone) {
      return;
    }

    // Reorder the array
    setItems((prev) => {
      const newItems = [...prev];
      const [removed] = newItems.splice(oldIndex, 1);
      if (removed) {
        newItems.splice(indexInDropZone, 0, removed);
      }

      // Update indices to match new positions
      return newItems.map((item, index) => ({ ...item, index }));
    });

    props.updateItemIndex(draggedId, indexInDropZone).then((success) => {
      if (!success) {
        // Revert the reorder if backend update fails
        setItems((prev) => {
          const newItems = [...prev];
          const [removed] = newItems.splice(indexInDropZone, 1);
          if (removed) {
            newItems.splice(oldIndex, 0, removed);
          }
          return newItems.map((item, index) => ({ ...item, index }));
        });
      }
    });
  };

  return {
    items,
    togglable: props.togglable ?? true,
    addActive,
    addItem,
    deleteItem,
    toggleItem,
    startEdit,
    saveEdit,
    cancelEdit,
    cancelAdd,
    reorder,
  };
}
