defmodule OperatelyWeb.Mcp.Tools.Search do
  use OperatelyWeb.Mcp.Tool

  @impl true
  def definition do
    Definition.new!(
      name: "search",
      title: "Search Operately",
      description: "Searches spaces, projects, goals, milestones, tasks, and people in the authenticated company.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 90,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "search"},
      examples: [%{"title" => "Search for roadmap work", "arguments" => %{"query" => "roadmap"}}],
      input_schema:
        JsonSchema.object(
          %{
            "query" => JsonSchema.string("The search text to match against Operately resources.")
          },
          required: ["query"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "spaces" => JsonSchema.array(JsonSchema.any_object(), description: "Matching spaces."),
            "projects" => JsonSchema.array(JsonSchema.any_object(), description: "Matching projects."),
            "goals" => JsonSchema.array(JsonSchema.any_object(), description: "Matching goals."),
            "milestones" => JsonSchema.array(JsonSchema.any_object(), description: "Matching milestones."),
            "tasks" => JsonSchema.array(JsonSchema.any_object(), description: "Matching tasks."),
            "people" => JsonSchema.array(JsonSchema.any_object(), description: "Matching people.")
          },
          required: ["spaces", "projects", "goals", "milestones", "tasks", "people"]
        )
    )
  end

  @impl true
  def call(_context, _arguments), do: not_implemented()
end
