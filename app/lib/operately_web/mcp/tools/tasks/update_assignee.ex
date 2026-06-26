defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateAssignee do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Tasks.UpdateAssignee, as: TaskUpdateAssignee
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_task_assignee",
      title: "Update Task Assignees",
      description:
        "Replaces the assignees of one task with the provided list. Pass an empty array or omit both assignee fields to clear all assignees.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 165,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [
        %{"title" => "Assign one person", "arguments" => %{"task_id" => "task_123", "assignee_id" => "person_123"}},
        %{
          "title" => "Assign multiple people",
          "arguments" => %{"task_id" => "task_123", "assignee_ids" => ["person_123", "person_456"]}
        },
        %{"title" => "Clear all assignees", "arguments" => %{"task_id" => "task_123", "assignee_ids" => []}}
      ],
      input_schema:
        JsonSchema.object(
          %{
            "task_id" => JsonSchema.string("The task identifier."),
            "assignee_ids" =>
              JsonSchema.array(
                JsonSchema.string("A person identifier."),
                description:
                  "The complete assignee list. Replaces all current assignees. Use an empty array to clear them."
              ),
            "assignee_id" =>
              JsonSchema.string(
                "A single assignee person identifier. Shorthand for assignee_ids with one value. Do not use together with assignee_ids."
              )
          },
          required: ["task_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"task" => JsonSchema.any_object("The updated task.")},
          required: ["task"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, task_id} <- Helpers.decode_id(arguments["task_id"]),
         {:ok, task} <- Helpers.load_task(conn.assigns.current_person, task_id),
         {:ok, type} <- Helpers.resolve_task_type(task),
         {:ok, assignee_ids} <- decode_assignee_ids(arguments) do
      TaskUpdateAssignee.call(conn, %{task_id: task_id, assignee_ids: assignee_ids, type: type})
    end
  end

  defp decode_assignee_ids(%{"assignee_id" => _, "assignee_ids" => _}), do: {:error, :invalid_arguments}

  defp decode_assignee_ids(%{"assignee_ids" => assignee_ids}), do: Helpers.decode_id_list(assignee_ids)

  defp decode_assignee_ids(%{"assignee_id" => assignee_id}) do
    with {:ok, assignee_id} <- Helpers.decode_optional_id(assignee_id) do
      {:ok, List.wrap(assignee_id)}
    end
  end

  defp decode_assignee_ids(_arguments), do: {:ok, []}
end
