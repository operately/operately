defmodule OperatelyWeb.Mcp.Tools.Projects.List do
  use OperatelyWeb.Mcp.Tool

  @impl true
  def definition do
    Definition.new!(
      name: "list_projects",
      title: "List Projects",
      description: "Lists projects in the authenticated company with optional filters.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 30,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [
        %{"title" => "List all visible projects", "arguments" => %{}},
        %{"title" => "List my projects in one space", "arguments" => %{"space_id" => "space_123", "only_my_projects" => true}}
      ],
      input_schema:
        JsonSchema.object(%{
          "space_id" => JsonSchema.string("Optional space identifier used to filter projects."),
          "goal_id" => JsonSchema.string("Optional goal identifier used to filter projects."),
          "only_my_projects" => JsonSchema.boolean("When true, return only projects where I am a champion or contributor."),
          "only_reviewed_by_me" => JsonSchema.boolean("When true, return only projects where I am the reviewer."),
          "include_archived" => JsonSchema.boolean("When true, include archived or closed projects.")
        }),
      output_schema:
        JsonSchema.object(
          %{
            "projects" => JsonSchema.array(JsonSchema.any_object(), description: "The matching projects.")
          },
          required: ["projects"]
        )
    )
  end

  @impl true
  def call(_context, _arguments), do: not_implemented()
end
