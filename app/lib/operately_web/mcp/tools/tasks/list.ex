defmodule OperatelyWeb.Mcp.Tools.Tasks.List do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Mcp.Helpers
  alias OperatelyWeb.Api.Spaces.ListTasks, as: SpaceTasksList
  alias OperatelyWeb.Api.Tasks.List, as: ProjectTasksList

  @impl true
  def definition do
    Definition.new!(
      name: "list_tasks",
      title: "List Tasks",
      description: "Lists tasks for exactly one project or one space in the authenticated company.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 70,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [
        %{"title" => "List tasks for a project", "arguments" => %{"project_id" => "project_123"}},
        %{"title" => "List tasks for a space", "arguments" => %{"space_id" => "space_123"}}
      ],
      input_schema:
        JsonSchema.object(%{
          "space_id" => JsonSchema.string("Optional space identifier used to filter tasks."),
          "project_id" => JsonSchema.string("Optional project identifier used to filter tasks.")
        }),
      output_schema:
        JsonSchema.object(
          %{
            "tasks" => JsonSchema.array(JsonSchema.any_object(), description: "The matching tasks.")
          },
          required: ["tasks"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    case {arguments["project_id"], arguments["space_id"]} do
      {nil, nil} ->
        {:error, :invalid_arguments}

      {project_id, nil} ->
        with {:ok, project_id} <- Helpers.decode_id(project_id) do
          ProjectTasksList.call(conn, %{project_id: project_id})
        end

      {nil, space_id} ->
        with {:ok, space_id} <- Helpers.decode_id(space_id) do
          SpaceTasksList.call(conn, %{space_id: space_id})
        end

      {_project_id, _space_id} ->
        {:error, :invalid_arguments}
    end
  end
end
