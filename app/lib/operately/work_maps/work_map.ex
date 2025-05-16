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
      |> Enum.sort_by(fn child ->
        # Show projects before subgoals
        case child.type do
          :project -> 0
          :goal -> 1
          _ -> 2
        end
      end)

    %{item | children: children}
  end

  @doc """
  Filters a flat list of WorkMapItem structs based on provided filters.

  Supported filters:
  - :space_id - Filters items by space ID
  - :parent_goal_id - Filters items by parent goal ID (includes entire subtree of items)
  - :owner_id - Filters items by owner ID

  If a parent item is filtered out but its children would remain, the children will be
  reparented to the nearest ancestor that passes the filter, or become root items
  if no suitable ancestor exists.

  Returns a flat list of filtered items that can be passed to build_hierarchy.
  """
  @spec filter_flat_list(list(WorkMapItem.t()), map()) :: list(WorkMapItem.t())
  def filter_flat_list(flat_items, filters) when is_list(flat_items) and is_map(filters) do
    if Enum.empty?(filters) do
      flat_items
    else
      all_items_map = Map.new(flat_items, fn item -> {item.id, item} end)

      # Parent goal is filtered differently
      parent_goal_id = Map.get(filters, :parent_goal_id)
      other_filters = Map.drop(filters, [:parent_goal_id])

      filtered_items =
        if Enum.empty?(other_filters) do
          flat_items
        else
          Enum.filter(flat_items, fn item ->
            matches_filters?(item, other_filters)
          end)
        end

      if parent_goal_id do
        # For parent_goal_id filter, we need all direct children of the parent_goal and their entire subtree
        direct_children =
          Enum.filter(filtered_items, fn item ->
            item.parent_id == parent_goal_id
          end)

        direct_children_ids = MapSet.new(direct_children, fn item -> item.id end)
        descendants = collect_subtree_items(direct_children_ids, filtered_items)

        Enum.concat(direct_children, descendants)
      else
        filtered_item_ids = MapSet.new(filtered_items, fn item -> item.id end)

        # Fix parent relationships
        Enum.map(filtered_items, fn item ->
          new_parent_id = find_nearest_matching_parent(item, item.parent_id, all_items_map, filtered_item_ids)
          %{item | parent_id: new_parent_id, children: []}
        end)
      end
    end
  end

  # Checks if an item matches all the provided filters
  defp matches_filters?(item, filters) do
    Enum.all?(filters, fn {filter_key, filter_value} ->
      if is_nil(filter_value) do
        true
      else
        case filter_key do
          :space_id ->
            item.space && item.space.id == filter_value
          :parent_goal_id ->
            item.parent_id == filter_value
          :owner_id ->
            item.owner && item.owner.id == filter_value
          _ ->
            true # Unknown filter keys are ignored
        end
      end
    end)
  end

  # Finds the nearest parent that passes the filter, or returns nil if none exists
  defp find_nearest_matching_parent(_item, nil, _all_items_map, _filtered_item_ids) do
    nil
  end

  defp find_nearest_matching_parent(item, parent_id, all_items_map, filtered_item_ids) do
    # If this parent is in the filtered items, use it
    if MapSet.member?(filtered_item_ids, parent_id) do
      parent_id
    else
      # Otherwise, look for this parent's parent
      parent = Map.get(all_items_map, parent_id)

      if parent do
        find_nearest_matching_parent(item, parent.parent_id, all_items_map, filtered_item_ids)
      else
        nil
      end
    end
  end

  # Recursively collects all items in the subtrees of the given parent IDs
  defp collect_subtree_items(parent_ids, all_items) do
    direct_children = Enum.filter(all_items, fn item ->
      item.parent_id && MapSet.member?(parent_ids, item.parent_id)
    end)

    if Enum.empty?(direct_children) do
      []
    else
      child_ids = MapSet.new(direct_children, fn item -> item.id end)

      # Recursively get all their descendants
      descendants = collect_subtree_items(child_ids, all_items)

      # Return the direct children plus all their descendants
      Enum.concat(direct_children, descendants)
    end
  end
end
