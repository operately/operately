defmodule OperatelyWeb.Mcp.Tools.Goals.List do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.List, as: GoalsList
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "list_goals",
      title: "List Goals",
      description: "Lists goals in the authenticated company with optional space filtering.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 50,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [
        %{"title" => "List all company goals", "arguments" => %{}},
        %{"title" => "List goals in one space", "arguments" => %{"space_id" => "space_123"}}
      ],
      input_schema:
        JsonSchema.object(%{
          "space_id" => JsonSchema.string("Optional space identifier used to filter goals.")
        }),
      output_schema:
        JsonSchema.object(
          %{
            "goals" => JsonSchema.array(JsonSchema.any_object(), description: "The matching goals.")
          },
          required: ["goals"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, space_id} <- Helpers.decode_optional_id(arguments["space_id"]) do
      GoalsList.call(conn, Helpers.put_optional(%{}, :space_id, space_id))
    end
  end
end
