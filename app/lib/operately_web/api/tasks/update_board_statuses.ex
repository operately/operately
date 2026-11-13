defmodule OperatelyWeb.Api.Tasks.UpdateBoardStatuses do
  @moduledoc "Updates a board's available task statuses, replacing deleted statuses in use when a mapping is supplied."
  use TurboConnect.Mutation
  alias OperatelyWeb.Api.Tasks.BoardMultiSteps, as: Steps
  alias OperatelyWeb.Api.Tasks.SharedMultiSteps, as: TaskSteps
  alias OperatelyWeb.Api.Spaces.SharedMultiSteps, as: SpaceSteps

  inputs do
    field :board_id, :id, null: false
    field :task_statuses, list_of(:task_status), null: false
    field? :deleted_status_replacements, list_of(:deleted_status_replacement), null: true
  end

  outputs do
    field :board_id, :id, null: false
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    replacements = inputs[:deleted_status_replacements] || []

    Steps.start(conn, inputs.board_id)
    |> Steps.validate_status_replacements(inputs.task_statuses, replacements)
    |> Steps.require_status_replacements(inputs.task_statuses, replacements)
    |> Steps.update_task_statuses(inputs.task_statuses)
    |> Steps.replace_deleted_task_statuses(replacements)
    |> SpaceSteps.commit()
    |> TaskSteps.broadcast_project_update()
    |> SpaceSteps.respond(fn changes -> %{success: true, board_id: Operately.ShortUuid.encode!(changes.board.id)} end)
  end
end
