defmodule OperatelyWeb.Api.Tasks.UpdateBoardKanban do
  @moduledoc "Updates task status and ordering on a project or space board. Milestone-specific ordering remains separate."
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers
  alias OperatelyWeb.Api.Tasks.BoardMultiSteps, as: Steps
  alias OperatelyWeb.Api.Tasks.SharedMultiSteps, as: TaskSteps
  alias OperatelyWeb.Api.Spaces.SharedMultiSteps, as: SpaceSteps

  inputs do
    field :board_id, :id, null: false
    field :task_id, :id, null: false
    field :status, :task_status, null: false
    field :kanban_state, :json, null: false
  end

  outputs do
    field :board_id, :id, null: false
    field :task, :task, null: false
  end

  def call(conn, inputs) do
    Steps.start(conn, inputs.board_id)
    |> SpaceSteps.find_task(inputs.task_id)
    |> Steps.update_kanban(inputs.status, inputs.kanban_state)
    |> SpaceSteps.commit()
    |> TaskSteps.broadcast_project_update()
    |> SpaceSteps.broadcast_review_count_update()
    |> SpaceSteps.respond(fn changes ->
      %{task: Serializer.serialize(changes.updated_task_with_preloads, level: :full), board_id: Operately.ShortUuid.encode!(changes.board.id)}
    end)
  end
end
