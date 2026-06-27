defmodule OperatelyWeb.Mcp.Tools.Projects.MoveToSpace do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.MoveToSpace, as: ProjectMoveToSpace
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "move_project_to_space",
      title: "Move Project To Space",
      description: "Moves one project to another space in the same company.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 128,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Move a project", "arguments" => %{"project_id" => "project_123", "space_id" => "space_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "space_id" => JsonSchema.string("The destination space identifier.")
          },
          required: ["project_id", "space_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the move succeeds.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, %{"project_id" => project_id, "space_id" => space_id}) do
    with {:ok, project_id} <- Helpers.decode_id(project_id),
         {:ok, space_id} <- Helpers.decode_id(space_id),
         {:ok, _result} <- ProjectMoveToSpace.call(conn, %{project_id: project_id, space_id: space_id}) do
      {:ok, %{success: true}}
    end
  end
end
