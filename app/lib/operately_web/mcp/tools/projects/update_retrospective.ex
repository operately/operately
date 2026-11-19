defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateRetrospective do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.UpdateRetrospective, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_retrospective",
      title: "Update Project Retrospective",
      description: "Edits the content and outcome of a project retrospective.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 135,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Update project retrospective", "arguments" => %{"retrospective_id" => "retrospective_123", "content" => "Lessons learned", "success_status" => "achieved"}}],
      input_schema:
        JsonSchema.object(
          %{
            "retrospective_id" => JsonSchema.string("The retrospective id."),
            "content" => JsonSchema.string("Retrospective content in Markdown."),
            "success_status" => JsonSchema.string("Project outcome.", enum: ["achieved", "missed"])
          },
          required: ["retrospective_id", "content", "success_status"]
        ),
      output_schema: JsonSchema.object(%{"retrospective" => JsonSchema.any_object()}, required: ["retrospective"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, retrospective_id} <- Helpers.decode_id(arguments["retrospective_id"]),
         {:ok, content} <- Helpers.markdown_to_rich_text(arguments["content"]),
         {:ok, success_status} <- Helpers.decode_enum(arguments["success_status"], ["achieved", "missed"]) do
      Api.call(conn, %{retrospective_id: retrospective_id, content: content, success_status: success_status})
    end
  end
end
