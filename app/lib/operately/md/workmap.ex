defmodule Operately.MD.Workmap do
  use Gettext, backend: OperatelyWeb.Gettext
  def render(work_map) do
    legend = """
    # #{gettext("Work Map Legend")}

    #{gettext("Returning a hierarchical view of all goals and projects in your company.")}

    #{gettext("**Item Format:** Name (Type) [ID: id] | Status | State | Progress | Champion | Space | Timeframe")}

    **#{gettext("Valid Statuses")}:**
    - on_track: #{gettext("Item is progressing as planned")}
    - caution: #{gettext("Item needs attention or has minor issues")}
    - issue: #{gettext("Item has significant problems or blockers")}
    - outdated: #{gettext("Item information is stale and needs updating")}

    **#{gettext("Valid States")}:**
    - active: #{gettext("Item is currently being worked on")}
    - paused: #{gettext("Item is temporarily stopped")}
    - completed: #{gettext("Item has been finished")}

    ---
    """

    # Filter out closed items unless they have non-closed children
    filtered_work_map = Enum.filter(work_map, &should_show_item?/1)

    tree_content =
      case filtered_work_map do
        [] ->
          gettext("Company Work Map\n└── (No items found)")

        items ->
          root_header = gettext("Company Work Map")

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
    name = Map.get(item, :name, gettext("Unnamed"))
    type = Map.get(item, :type, "unknown")
    status = Map.get(item, :status, "unknown")
    state = Map.get(item, :state, "unknown")
    progress = Map.get(item, :progress, 0)

    champion_name = champion_name(item)
    space_name = space_name(item)
    timeframe = format_timeframe(item)

    "#{name} (#{type}) [ID: #{id}] | #{gettext("Status")}: #{status} | #{gettext("State")}: #{state} | #{gettext("Progress")}: #{round(progress)}% | #{gettext("Champion")}: #{champion_name} | #{gettext("Space")}: #{space_name}#{timeframe}"
  end

  defp champion_name(item) do
    case Map.get(item, :owner) do
      nil -> gettext("Unassigned")
      champion -> Map.get(champion, :full_name, gettext("Unknown Champion"))
    end
  end

  defp space_name(item) do
    case Map.get(item, :space) do
      nil -> gettext("No Space")
      space -> Map.get(space, :name, gettext("Unknown Space"))
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
          {start_date, nil} -> " | #{gettext("From")}: #{start_date}"
          {nil, end_date} -> " | #{gettext("Due")}: #{end_date}"
          {start_date, end_date} -> " | " <> gettext("From: %{start_date} to %{end_date}", start_date: start_date, end_date: end_date)
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
