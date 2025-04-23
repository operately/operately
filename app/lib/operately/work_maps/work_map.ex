defmodule Operately.WorkMaps.WorkMap do
  @moduledoc """
  Functions for working with work maps (hierarchical structures of goals and projects)
  """

  alias Operately.WorkMaps.WorkMapItem

  @doc """
  Builds a hierarchical structure from a flat list of WorkMapItem structs.

  This function:
  1. Identifies all items whose parent_id is nil or not present in the list (root items)
  2. For each item with a parent in the list, adds it as a child of that parent
  3. Returns a list of root items with their children properly nested

  ## Examples

      iex> items = [
      ...>   %WorkMapItem{id: 1, parent_id: nil, name: "Root 1", children: []},
      ...>   %WorkMapItem{id: 2, parent_id: 1, name: "Child 1", children: []},
      ...>   %WorkMapItem{id: 3, parent_id: 1, name: "Child 2", children: []},
      ...>   %WorkMapItem{id: 4, parent_id: nil, name: "Root 2", children: []}
      ...> ]
      iex> build_hierarchy(items)
      [
        %WorkMapItem{id: 1, parent_id: nil, name: "Root 1", children: [
          %WorkMapItem{id: 2, parent_id: 1, name: "Child 1", children: []},
          %WorkMapItem{id: 3, parent_id: 1, name: "Child 2", children: []}
        ]},
        %WorkMapItem{id: 4, parent_id: nil, name: "Root 2", children: []}
      ]
  """
  @spec build_hierarchy(list(WorkMapItem.t())) :: list(WorkMapItem.t())
  def build_hierarchy(items) when is_list(items) do
    item_map = Map.new(items, fn item -> {item.id, item} end)

    # Group items by their parent_id
    items_by_parent = Enum.group_by(items, fn item -> item.parent_id end)

    # Get root items (parent_id is nil or parent not in the list)
    root_items =
      (Map.get(items_by_parent, nil, []) ++
       Enum.filter(items, fn item ->
         item.parent_id && !Map.has_key?(item_map, item.parent_id)
       end))
      |> Enum.uniq_by(fn item -> item.id end)

    # Build the hierarchy starting from root items
    Enum.map(root_items, fn root_item ->
      add_children(root_item, items_by_parent)
    end)
  end

  # No children case - return the item as is
  defp add_children(item, items_by_parent) when not is_map_key(items_by_parent, item.id) do
    %{item | children: []}
  end

  # Add children to an item recursively
  defp add_children(item, items_by_parent) do
    children =
      items_by_parent
      |> Map.get(item.id, [])
      |> Enum.map(fn child -> add_children(child, items_by_parent) end)

    %{item | children: children}
  end
end
