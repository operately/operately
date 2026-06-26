defmodule OperatelyWeb.Mcp.Tools.Goals.Create do
  use OperatelyWeb.Mcp.Tool

  alias Operately.ContextualDates.Timeframe
  alias OperatelyWeb.Api.Goals.Create, as: GoalCreate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_goal",
      title: "Create Goal",
      description: "Creates a new goal in one space using the standard Operately access defaults for that space.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 140,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [
        %{
          "title" => "Create a goal in a space",
          "arguments" => %{
            "space_id" => "space_123",
            "name" => "Increase retention",
            "description" => "Improve onboarding and activation."
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("The space where the goal will be created."),
            "name" => JsonSchema.string("The goal name."),
            "champion_id" => JsonSchema.string("An optional champion person identifier."),
            "reviewer_id" => JsonSchema.string("An optional reviewer person identifier."),
            "parent_goal_id" => JsonSchema.string("An optional parent goal identifier."),
            "description" => JsonSchema.string("An optional plain text or markdown goal description."),
            "start_date" => JsonSchema.string("An optional ISO start date, for example 2026-07-01."),
            "due_date" => JsonSchema.string("An optional ISO due date, for example 2026-09-30.")
          },
          required: ["space_id", "name"]
        ),
      output_schema:
        JsonSchema.object(
          %{"goal" => JsonSchema.any_object("The created goal.")},
          required: ["goal"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, space_id} <- Helpers.decode_id(arguments["space_id"]),
         {:ok, description} <- decode_optional_description(arguments["description"]),
         {:ok, champion_id} <- Helpers.decode_optional_id(arguments["champion_id"]),
         {:ok, reviewer_id} <- Helpers.decode_optional_id(arguments["reviewer_id"]),
         {:ok, parent_goal_id} <- Helpers.decode_optional_id(arguments["parent_goal_id"]),
         {:ok, timeframe} <- decode_optional_timeframe(arguments["start_date"], arguments["due_date"]),
         {:ok, space} <- Helpers.load_space_with_access_levels(conn.assigns.current_person, space_id) do
      defaults = Helpers.default_nested_access_levels(space)

      GoalCreate.call(conn, %{
        space_id: space_id,
        name: arguments["name"],
        champion_id: champion_id,
        reviewer_id: reviewer_id,
        parent_goal_id: parent_goal_id,
        description: description,
        timeframe: timeframe,
        anonymous_access_level: defaults.anonymous,
        company_access_level: defaults.company,
        space_access_level: defaults.space
      })
    end
  end

  defp decode_optional_description(nil), do: {:ok, nil}
  defp decode_optional_description(description), do: Helpers.markdown_to_rich_text_allow_blank(description)

  defp decode_optional_timeframe(nil, nil), do: {:ok, nil}

  defp decode_optional_timeframe(start_date, due_date) do
    with {:ok, start_date} <- Helpers.parse_day_date(start_date),
         {:ok, due_date} <- Helpers.parse_day_date(due_date) do
      {:ok, %Timeframe{contextual_start_date: start_date, contextual_end_date: due_date}}
    end
  end
end
