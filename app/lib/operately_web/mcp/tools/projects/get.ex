defmodule OperatelyWeb.Mcp.Tools.Projects.Get do
  use OperatelyWeb.Mcp.Tool

  @impl true
  def definition do
    Definition.new!(
      name: "get_project",
      title: "Get Project",
      description: "Returns one project by identifier.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 40,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Open a project by ID", "arguments" => %{"project_id" => "project_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier.")
          },
          required: ["project_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "project" => JsonSchema.any_object("The matching project.")
          },
          required: ["project"]
        )
    )
  end

  @impl true
  def call(_context, _arguments), do: not_implemented()
end
