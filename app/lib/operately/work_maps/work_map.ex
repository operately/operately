defmodule Operately.WorkMaps.WorkMap do
  alias Operately.WorkMaps.WorkMapItem
  alias Operately.Goals.Goal
  alias Operately.Projects.Project

  @doc """
  Builds a hierarchical structure from a flat list of WorkMapItem structs.

  This function:
  1. Identifies all items whose parent_id is nil or not in the list (root items)
  2. For each item with a parent in the list, adds it as a child of that parent
  3. Returns a list of root items with their children properly nested
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
  Filters items directly, only keeping items that match the filter criteria.
  Does NOT preserve parent hierarchy - only direct matches are kept.

  Supported filters:
  - :space_id - Filters items by space ID
  - :parent_goal_id - Filters items by parent goal ID
  - :champion_id - Filters items by champion ID
  - :reviewer_id - Filters items by reviewer ID
  - :contributor_id - Filters items by contributor ID

  Returns a flat list of filtered items with empty children lists.
  """
  def filter_direct_matches(flat_items, filters) when filters == %{} do
    Enum.map(flat_items, &%{&1 | children: []})
  end

  def filter_direct_matches(flat_items, filters) when is_list(flat_items) and is_map(filters) do
    find_direct_matches(flat_items, filters)
    |> Enum.map(&%{&1 | children: []})
  end

  @doc """
  Filters a flat list of work map items based on filters, preserving parent hierarchy.

  Supported filters:
  - :space_id - Filters items by space ID
  - :parent_goal_id - Filters items by parent goal ID (includes entire subtree of items)
  - :champion_id - Filters items by champion ID
  - :reviewer_id - Filters items by reviewer ID
  - :contributor_id - Filters items by contributor ID

  If a parent item is filtered out but its children would remain, the hierarchy is preserved
  by including all parent items needed to maintain the relationships.

  Returns a flat list of filtered items that can be passed to build_hierarchy.
  """
  def filter_flat_list(flat_items, filters) when filters == %{}, do: flat_items

  def filter_flat_list(flat_items, filters) when is_list(flat_items) and is_map(filters) do
    parent_goal_id = Map.get(filters, :parent_goal_id)
    other_filters = Map.drop(filters, [:parent_goal_id])

    if parent_goal_id do
      filter_by_parent_goal(flat_items, parent_goal_id, other_filters)
    else
      directly_matched_items = find_direct_matches(flat_items, other_filters)
      filter_without_parent_goal(flat_items, directly_matched_items, other_filters)
    end
  end

  defp filter_by_parent_goal(flat_items, parent_goal_id, other_filters) do
    direct_children = Enum.filter(flat_items, &(&1.parent_id == parent_goal_id))
    all_descendants = Enum.flat_map(direct_children, &get_full_subtree(&1.id, flat_items))
    subtree_items = direct_children ++ all_descendants

    if Enum.empty?(other_filters) do
      subtree_items
    else
      matching_direct_children = Enum.filter(direct_children, &matches_filter?(&1, other_filters))

      children_with_matching_descendants =
        Enum.filter(direct_children, fn direct_child ->
          child_descendants = get_full_subtree(direct_child.id, flat_items)
          Enum.any?(child_descendants, &matches_filter?(&1, other_filters))
        end)

      all_qualifying_children =
        (matching_direct_children ++ children_with_matching_descendants)
        |> Enum.uniq_by(&(&1.id))

      matching_descendants =
        Enum.flat_map(all_qualifying_children, fn direct_child ->
          descendants = get_full_subtree(direct_child.id, flat_items)
          Enum.filter(descendants, &matches_filter?(&1, other_filters))
        end)

      (all_qualifying_children ++ matching_descendants)
      |> Enum.uniq_by(&(&1.id))
    end
  end

  defp filter_without_parent_goal(flat_items, matched_items, filters) do
    all_items_map = Map.new(flat_items, &{&1.id, &1})

    parent_ids = collect_all_parent_ids(matched_items, all_items_map, filters)
    parent_items = Enum.filter(flat_items, &MapSet.member?(parent_ids, &1.id))

    filtered_items = Enum.concat(matched_items, parent_items)
    unique_items = Enum.uniq_by(filtered_items, &(&1.id))

    Enum.map(unique_items, &%{&1 | children: []})
  end

  #
  # Filters
  #

  defp find_direct_matches(flat_items, filters) when filters == %{}, do: flat_items
  defp find_direct_matches(flat_items, filters) do
    Enum.filter(flat_items, fn item -> matches_filter?(item, filters) end)
  end

  # Match filters with the following logic:
  # - Space and parent filters use AND logic
  # - Person-related filters (champion, reviewer, contributor) use OR logic between them
  # - Both groups use AND logic between them
  defp matches_filter?(item, filters) do
    matches_person_filter?(item, filters) && matches_standard_filters?(item, filters)
  end

  defp matches_standard_filters?(item, filters) do
    standard_filters = Map.drop(filters, [:champion_id, :reviewer_id, :contributor_id])

    if Enum.empty?(standard_filters) do
      true
    else
      # Standard filters use AND logic
      Enum.all?(standard_filters, fn {filter_key, filter_value} ->
        if is_nil(filter_value) do
          true
        else
          case filter_key do
            :space_id ->
              item.space && item.space.id == filter_value
            :parent_goal_id ->
              item.parent_id == filter_value
            :only_completed ->
              matches_completion_status?(item, filter_value)
            _ ->
              true  # Unknown filter keys are ignored
          end
        end
      end)
    end
  end

  defp matches_completion_status?(item, true) do
    case item.type do
      :goal -> Goal.state(item.resource) == :closed
      :project -> Project.state(item.resource) == :closed
      _ -> true
    end
  end
  defp matches_completion_status?(_, _), do: true

  defp matches_person_filter?(item, filters) do
    person_filters = filters
      |> Map.reject(fn {_, v} -> is_nil(v) end)
      |> Map.take([:champion_id, :reviewer_id, :contributor_id])

    if Enum.empty?(person_filters) do
      true
    else
      # Person filters use OR logic between them
      Enum.any?(person_filters, fn {filter_key, filter_value} ->
        case filter_key do
          :champion_id ->
            item.champion && item.champion.id == filter_value
          :reviewer_id ->
            item.reviewer && item.reviewer.id == filter_value
          :contributor_id ->
            reviewer_id = get_project_reviewer_id(item.resource)
            item.contributor && item.contributor.id == filter_value && reviewer_id != filter_value
        end
      end)
    end
  end

  defp collect_all_parent_ids(items, all_items_map, filters) do
    Enum.reduce(items, MapSet.new(), fn item, acc ->
      restriction = parent_restriction_for_item(item, filters)
      collect_parent_ids_for_item(item, all_items_map, acc, restriction)
    end)
  end

  defp collect_parent_ids_for_item(%{parent_id: nil}, _all_items_map, acc, _restriction), do: acc
  defp collect_parent_ids_for_item(%{parent_id: parent_id}, all_items_map, acc, restriction) do
    parent = Map.get(all_items_map, parent_id)

    if include_parent?(parent, restriction) do
      acc = MapSet.put(acc, parent_id)

      if parent do
        collect_parent_ids_for_item(parent, all_items_map, acc, restriction)
      else
        acc
      end
    else
      acc
    end
  end

  defp parent_restriction_for_item(%{type: :project, state: state}, filters) when state in [:paused, :closed] do
    Map.get(filters, :space_id)
  end
  defp parent_restriction_for_item(%{type: :goal, state: :closed}, filters) do
    Map.get(filters, :space_id)
  end
  defp parent_restriction_for_item(_, _), do: nil

  defp include_parent?(_parent, nil), do: true
  defp include_parent?(nil, _restriction), do: false
  defp include_parent?(%{space: nil}, _restriction), do: false
  defp include_parent?(%{space: space}, restriction), do: space.id == restriction

  # Recursively collects all items in the subtrees of the given parent IDs
  # Returns all items in the subtree of the given parent_id (excluding the parent itself)
  defp get_full_subtree(parent_id, all_items) do
    # Find immediate children
    children = Enum.filter(all_items, fn item ->
      item.parent_id == parent_id
    end)

    if Enum.empty?(children) do
      []
    else
      # For each child, recursively get its subtree
      descendants = Enum.flat_map(children, fn child ->
        get_full_subtree(child.id, all_items)
      end)

      # Return children and all their descendants
      children ++ descendants
    end
  end

  defp get_project_reviewer_id(%{ contributors: contributors }) do
    Enum.find_value(contributors, fn
      %{ role: :reviewer, person_id: person_id } -> person_id
      _ -> nil
    end)
  end
  defp get_project_reviewer_id(_), do: nil
end
