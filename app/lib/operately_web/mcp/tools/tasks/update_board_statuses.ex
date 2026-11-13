defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateBoardStatuses do
  use OperatelyWeb.Mcp.Tool
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_task_board_statuses",
      title: "Update Task Board Statuses",
      description: "Updates the workflow statuses of a project or space board. Read get_task_board first, preserve existing status IDs, and provide a replacement for every removed status in use.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 163,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [
        %{
          "title" => "Set a board workflow",
          "arguments" => %{
            "board_id" => "board_123",
            "task_statuses" => [
              %{"id" => "pending", "label" => "Pending", "color" => "gray", "index" => 0, "value" => "pending", "closed" => false}
            ]
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "board_id" => JsonSchema.string("The project or space task board identifier."),
            "task_statuses" =>
              JsonSchema.array(
                JsonSchema.object(
                  %{
                    "id" => JsonSchema.string("The stable status ID."),
                    "label" => JsonSchema.string("The display label."),
                    "color" => JsonSchema.string("The status color."),
                    "index" => JsonSchema.integer("The zero-based workflow order.", minimum: 0),
                    "value" => JsonSchema.string("The stable status value."),
                    "closed" => JsonSchema.boolean("Whether tasks in this status are closed.")
                  },
                  required: ["id", "label", "color", "index", "value", "closed"]
                )
              ),
            "deleted_status_replacements" =>
              JsonSchema.array(
                JsonSchema.object(
                  %{
                    "deleted_status_id" => JsonSchema.string("A removed status ID."),
                    "replacement_status_id" => JsonSchema.string("The replacement status ID.")
                  },
                  required: ["deleted_status_id", "replacement_status_id"]
                )
              )
          },
          required: ["board_id", "task_statuses"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "success" => JsonSchema.boolean("Whether the update succeeded."),
            "board_id" => JsonSchema.string("The updated board identifier.")
          },
          required: ["success", "board_id"]
        )
    )
  end

  @impl true
  def call(conn, %{"board_id" => board_id} = arguments) when is_binary(board_id) do
    with {:ok, board_id} <- Helpers.decode_id(arguments["board_id"]),
         {:ok, statuses} <- Helpers.decode_task_statuses(arguments["task_statuses"]),
         {:ok, replacements} <- Helpers.decode_status_replacements(arguments["deleted_status_replacements"] || []) do
      OperatelyWeb.Api.Tasks.UpdateBoardStatuses.call(conn, %{board_id: board_id, task_statuses: statuses, deleted_status_replacements: replacements})
    end
  end

  def call(_conn, _arguments), do: {:error, :invalid_arguments}
end
