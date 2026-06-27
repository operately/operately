defmodule OperatelyWeb.Mcp.Tools.Projects.Close do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.Close, as: ProjectClose
  alias OperatelyWeb.Mcp.Helpers

  @valid_success_statuses ["achieved", "missed"]

  @impl true
  def definition do
    Definition.new!(
      name: "close_project",
      title: "Close Project",
      description: "Closes one project with a retrospective and outcome.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 131,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Close a project", "arguments" => %{"project_id" => "project_123", "success_status" => "achieved", "retrospective" => "We shipped the main scope."}}],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "success_status" => JsonSchema.string("Whether the project was achieved or missed.", enum: @valid_success_statuses),
            "retrospective" => JsonSchema.string("The closing retrospective in plain text or markdown.")
          },
          required: ["project_id", "success_status", "retrospective"]
        ),
      output_schema:
        JsonSchema.object(
          %{"retrospective" => JsonSchema.any_object("The created retrospective.")},
          required: ["retrospective"]
        )
    )
  end

  @impl true
  def call(conn, %{"project_id" => project_id, "success_status" => success_status, "retrospective" => retrospective}) do
    with {:ok, project_id} <- Helpers.decode_id(project_id),
         {:ok, retrospective} <- Helpers.markdown_to_rich_text(retrospective) do
      ProjectClose.call(conn, %{
        project_id: project_id,
        success_status: String.to_existing_atom(success_status),
        retrospective: retrospective,
        subscriber_ids: []
      })
    end
  end
end
