import { useState } from "react";
import type { KpiGoalLinkItem } from "../../ApiTypes";
import type { KpiGoalLinksProps } from "../../KpiGoalLinks";

const kpis: KpiGoalLinkItem[] = [
  {
    __typename: "kpi_goal_link_item",
    id: "active-teams",
    name: "Weekly active teams",
    spaceName: "Product",
    canUnlink: true,
  },
  { __typename: "kpi_goal_link_item", id: "partners", name: "Design partners", spaceName: "Growth", canUnlink: true },
];
export function useDemoKpiGoalLinks(): KpiGoalLinksProps {
  const [items, setItems] = useState(kpis.slice(1));
  const [query, search] = useState<string | null>(null);
  const choices = kpis.filter(
    (item) => !items.includes(item) && item.name.toLowerCase().includes((query ?? "").toLowerCase()),
  );

  return {
    items,
    href: (item) => `#${item.id}`,
    canLink: items.length < kpis.length,
    loading: false,
    error: false,
    retry: () => {},
    saving: false,
    search,
    picker: query === null ? null : { query, items: choices, loading: false, error: false, retry: () => {} },
    setLink: (id, linked) => {
      setItems(kpis.filter((item) => (item.id === id ? linked : items.includes(item))));
      search(null);
    },
  };
}
