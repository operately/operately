defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateReviewer do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.UpdateReviewer, as: ProjectUpdateReviewer
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_reviewer",
      title: "Update Project Reviewer",
      description: "Updates or clears the reviewer of one project.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 126,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Assign a reviewer", "arguments" => %{"project_id" => "project_123", "reviewer_id" => "person_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "reviewer_id" => JsonSchema.string("The new reviewer person identifier. Omit it to clear the reviewer.")
          },
          required: ["project_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the update succeeds.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, project_id} <- Helpers.decode_id(arguments["project_id"]),
         {:ok, reviewer_id} <- Helpers.decode_optional_id(arguments["reviewer_id"]) do
      ProjectUpdateReviewer.call(conn, %{project_id: project_id, reviewer_id: reviewer_id})
    end
  end
end
