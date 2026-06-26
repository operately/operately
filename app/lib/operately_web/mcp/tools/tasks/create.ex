defmodule OperatelyWeb.Mcp.Tools.Tasks.Create do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Tasks.Create, as: TaskCreate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_task",
      title: "Create Task",
      description: "Creates a new task in exactly one project or one space.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 160,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [
        %{"title" => "Create a project task", "arguments" => %{"project_id" => "project_123", "name" => "Draft launch plan"}},
        %{"title" => "Create a space task", "arguments" => %{"space_id" => "space_123", "name" => "Review hiring plan"}}
      ],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project where the task should be created."),
            "space_id" => JsonSchema.string("The space where the task should be created."),
            "milestone_id" => JsonSchema.string("An optional milestone identifier for project tasks."),
            "name" => JsonSchema.string("The task name."),
            "assignee_id" => JsonSchema.string("An optional assignee person identifier."),
            "description" => JsonSchema.string("An optional plain text or markdown task description."),
            "due_date" => JsonSchema.string("An optional ISO due date, for example 2026-07-01.")
          },
          required: ["name"]
        ),
      output_schema:
        JsonSchema.object(
          %{"task" => JsonSchema.any_object("The created task.")},
          required: ["task"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, type, parent_id} <- decode_parent(arguments),
         {:ok, milestone_id} <- decode_milestone(arguments, type),
         {:ok, assignee_id} <- Helpers.decode_optional_id(arguments["assignee_id"]),
         {:ok, description} <- decode_optional_description(arguments["description"]),
         {:ok, due_date} <- Helpers.parse_day_date(arguments["due_date"]) do
      TaskCreate.call(conn, %{
        type: type,
        id: parent_id,
        milestone_id: milestone_id,
        name: arguments["name"],
        assignee_id: assignee_id,
        description: description,
        due_date: due_date
      })
    end
  end

  defp decode_parent(%{"project_id" => _project_id, "space_id" => _space_id}), do: {:error, :invalid_arguments}

  defp decode_parent(%{"project_id" => project_id}) do
    with {:ok, project_id} <- Helpers.decode_id(project_id) do
      {:ok, :project, project_id}
    end
  end

  defp decode_parent(%{"space_id" => space_id}) do
    with {:ok, space_id} <- Helpers.decode_id(space_id) do
      {:ok, :space, space_id}
    end
  end

  defp decode_parent(_arguments), do: {:error, :invalid_arguments}

  defp decode_milestone(arguments, :project), do: Helpers.decode_optional_id(arguments["milestone_id"])
  defp decode_milestone(%{"milestone_id" => _milestone_id}, :space), do: {:error, :invalid_arguments}
  defp decode_milestone(_arguments, :space), do: {:ok, nil}

  defp decode_optional_description(nil), do: {:ok, nil}
  defp decode_optional_description(description), do: Helpers.markdown_to_rich_text_allow_blank(description)
end
