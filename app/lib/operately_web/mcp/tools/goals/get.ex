defmodule OperatelyWeb.Mcp.Tools.Goals.Get do
  use OperatelyWeb.Mcp.Tool

  @impl true
  def definition do
    Definition.new!(
      name: "get_goal",
      title: "Get Goal",
      description: "Returns one goal by identifier.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 60,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Open a goal by ID", "arguments" => %{"goal_id" => "goal_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier.")
          },
          required: ["goal_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "goal" => JsonSchema.any_object("The matching goal.")
          },
          required: ["goal"]
        )
    )
  end

  @impl true
  def call(_context, _arguments), do: not_implemented()
end
