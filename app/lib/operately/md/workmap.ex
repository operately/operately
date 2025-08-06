defmodule Operately.MD.Workmap do
  def render(work_map) do
    legend = """
    # Work Map Legend

    Returning a hierarchical view of all goals and projects in your company.

    **Item Format:** Name (Type) [ID: id] | Status | State | Progress | Champion | Space | Timeframe

    **Valid Statuses:**
    - on_track: Item is progressing as planned
    - caution: Item needs attention or has minor issues
    - issue: Item has significant problems or blockers
    - outdated: Item information is stale and needs updating

    **Valid States:**
    - active: Item is currently being worked on
    - paused: Item is temporarily stopped
    - completed: Item has been finished

    ---
    """

    # Filter out closed items unless they have non-closed children
    filtered_work_map = Enum.filter(work_map, &should_show_item?/1)

    tree_content =
      case filtered_work_map do
        [] ->
          "Company Work Map\n└── (No items found)"

        items ->
          root_header = "Company Work Map"

          formatted_items =
            items
            |> Enum.with_index()
            |> Enum.map(fn {item, index} ->
              is_last = index == length(items) - 1
              format_item(item, [], is_last)
            end)
            |> Enum.join("\n")

          "#{root_header}\n#{formatted_items}"
      end

    "#{legend}\n#{tree_content}"
  end

  defp format_item(item, prefixes, is_last) do
    # Current item prefix - always add tree characters
    current_prefix = if is_last, do: "└── ", else: "├── "

    # Build the full prefix from parent prefixes
    full_prefix =
      prefixes
      |> Enum.reverse()
      |> Enum.join("")

    # Format the main item line
    main_line = "#{full_prefix}#{current_prefix}#{format_item_details(item)}"

    # Format children if they exist - filter them as well
    children = Map.get(item, :children, [])
    filtered_children = Enum.filter(children, &should_show_item?/1)

    children_lines =
      case filtered_children do
        [] ->
          []

        children ->
          # New prefix for children based on current item position
          new_prefix = if is_last, do: "    ", else: "│   "
          updated_prefixes = [new_prefix | prefixes]

          children
          |> Enum.with_index()
          |> Enum.map(fn {child, index} ->
            child_is_last = index == length(children) - 1
            format_item(child, updated_prefixes, child_is_last)
          end)
      end

    [main_line | children_lines]
    |> Enum.join("\n")
  end

  defp format_item_details(item) do
    id = Map.get(item, :id, "unknown")
    name = Map.get(item, :name, "Unnamed")
    type = Map.get(item, :type, "unknown")
    status = Map.get(item, :status, "unknown")
    state = Map.get(item, :state, "unknown")
    progress = Map.get(item, :progress, 0)

    champion_name = champion_name(item)
    space_name = space_name(item)
    timeframe = format_timeframe(item)

    "#{name} (#{type}) [ID: #{id}] | Status: #{status} | State: #{state} | Progress: #{round(progress)}% | Champion: #{champion_name} | Space: #{space_name}#{timeframe}"
  end

  defp champion_name(item) do
    case Map.get(item, :owner) do
      nil -> "Unassigned"
      champion -> Map.get(champion, :full_name, "Unknown Champion")
    end
  end

  defp space_name(item) do
    case Map.get(item, :space) do
      nil -> "No Space"
      space -> Map.get(space, :name, "Unknown Space")
    end
  end

  defp format_timeframe(item) do
    case Map.get(item, :timeframe) do
      nil ->
        ""

      tf ->
        start_date = Map.get(tf, :start_date)
        end_date = Map.get(tf, :end_date)

        case {start_date, end_date} do
          {nil, nil} -> ""
          {start_date, nil} -> " | From: #{start_date}"
          {nil, end_date} -> " | Due: #{end_date}"
          {start_date, end_date} -> " | From: #{start_date} to #{end_date}"
        end
    end
  end

  # Filter function to determine if an item should be shown
  # Show item if:
  # 1. It's not closed, OR
  # 2. It's closed but has children that are not closed
  defp should_show_item?(item) do
    state = Map.get(item, :state, "unknown")

    case state do
      "closed" ->
        # If closed, only show if it has non-closed children
        children = Map.get(item, :children, [])
        has_non_closed_children?(children)

      _ ->
        # Show all non-closed items
        true
    end
  end

  # Check if any children (recursively) are not closed
  defp has_non_closed_children?(children) do
    Enum.any?(children, fn child ->
      child_state = Map.get(child, :state, "unknown")

      case child_state do
        "closed" ->
          # If this child is closed, check if it has non-closed children
          grandchildren = Map.get(child, :children, [])
          has_non_closed_children?(grandchildren)

        _ ->
          # This child is not closed
          true
      end
    end)
  end
end
