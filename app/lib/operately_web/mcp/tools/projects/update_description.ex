defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateDescription do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.UpdateDescription, as: ProjectUpdateDescription
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_description",
      title: "Update Project Description",
      description: "Updates or clears the markdown description of one project.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 122,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Change a project description", "arguments" => %{"project_id" => "project_123", "description" => "Updated description"}}],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "description" => JsonSchema.string("The new plain text or markdown description. Omit it or use an empty string to clear it.")
          },
          required: ["project_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"project" => JsonSchema.any_object("The updated project.")},
          required: ["project"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, project_id} <- Helpers.decode_id(arguments["project_id"]),
         {:ok, description} <- decode_description(arguments["description"]) do
      ProjectUpdateDescription.call(conn, %{project_id: project_id, description: description})
    end
  end

  defp decode_description(nil), do: Helpers.markdown_to_rich_text_allow_blank("")
  defp decode_description(description), do: Helpers.markdown_to_rich_text_allow_blank(description)
end
