defmodule Operately.AI.Tools.WorkMap do
  alias Operately.AI.Tools.Base
  alias Operately.WorkMaps.GetWorkMapQuery

  def work_map do
    Base.new_tool(%{
      name: "get_work_map",
      description: "Returns all goals and projects for a given person.",
      function: fn _, context ->
        person = Map.get(context, :person)

        {:ok, workmap} = GetWorkMapQuery.execute(person, %{company_id: person.company_id})
        api_serialized = OperatelyWeb.Api.Serializer.serialize(workmap, level: :essential)

        {:ok, as_markdown(api_serialized)}
      end
    })
  end

  def as_markdown(work_map) do
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

    tree_content =
      case work_map do
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

    # Format children if they exist
    children = Map.get(item, :children, [])

    children_lines =
      case children do
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

    champion_name =
      case Map.get(item, :champion) do
        nil -> "Unassigned"
        champion -> Map.get(champion, :full_name, "Unknown Champion")
      end

    space_name =
      case Map.get(item, :space) do
        nil -> "No Space"
        space -> Map.get(space, :name, "Unknown Space")
      end

    timeframe =
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

    "#{name} (#{type}) [ID: #{id}] | Status: #{status} | State: #{state} | Progress: #{round(progress)}% | Champion: #{champion_name} | Space: #{space_name}#{timeframe}"
  end
end
