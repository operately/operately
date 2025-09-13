export interface WorkMapItem {
  id: string;
  parentId: string | null;
  name: string;
  children: WorkMapItem[];
}

/**
 * Recursively collect all item IDs from a WorkMap items array
 */
export function getAllWorkMapIds(items: WorkMapItem[]): string[] {
  const ids: string[] = [];
  
  const collectIds = (itemList: WorkMapItem[]) => {
    itemList.forEach((item) => {
      ids.push(item.id);
      if (item.children && item.children.length > 0) {
        collectIds(item.children);
      }
    });
  };
  
  collectIds(items);
  return ids;
}