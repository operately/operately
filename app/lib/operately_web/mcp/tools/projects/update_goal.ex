defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateGoal do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.UpdateParentGoal, as: ProjectUpdateGoal
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_goal",
      title: "Update Project Goal",
      description: "Connects a project to a goal or clears the current goal connection.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 127,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Connect a project to a goal", "arguments" => %{"project_id" => "project_123", "goal_id" => "goal_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "goal_id" => JsonSchema.string("The goal identifier. Omit it to clear the current goal.")
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
         {:ok, goal_id} <- Helpers.decode_optional_id(arguments["goal_id"]) do
      ProjectUpdateGoal.call(conn, %{project_id: project_id, goal_id: goal_id})
    end
  end
end
