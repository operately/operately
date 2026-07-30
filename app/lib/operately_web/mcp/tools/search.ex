defmodule OperatelyWeb.Mcp.Tools.Search do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Wrappers.Companies.GlobalSearch

  @impl true
  def definition do
    Definition.new!(
      name: "search",
      title: "Search Operately",
      description: "Searches visible resources by title or name in the authenticated company.",
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
            "people" => JsonSchema.array(JsonSchema.any_object(), description: "Matching people."),
            "discussions" => JsonSchema.array(JsonSchema.any_object(), description: "Matching discussions."),
            "folders" => JsonSchema.array(JsonSchema.any_object(), description: "Matching folders."),
            "documents" => JsonSchema.array(JsonSchema.any_object(), description: "Matching documents."),
            "files" => JsonSchema.array(JsonSchema.any_object(), description: "Matching files."),
            "links" => JsonSchema.array(JsonSchema.any_object(), description: "Matching links.")
          },
          required: ["spaces", "projects", "goals", "milestones", "tasks", "people", "discussions", "folders", "documents", "files", "links"]
        )
    )
  end

  @impl true
  def call(conn, %{"query" => query}), do: GlobalSearch.call(conn, %{query: query})
end
