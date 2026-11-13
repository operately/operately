defmodule OperatelyWeb.Api.Tasks.GetBoard do
  @moduledoc "Returns a project or space task board, including its owner, statuses, and kanban ordering. Archived boards remain readable. Optional owner selectors must match."
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field? :space_id, :id, null: true
    field? :project_id, :id, null: true
    field :board_id, :id, null: false
  end

  outputs do
    field :board, :task_board, null: false
  end

  def call(conn, inputs) do
    with {:ok, %{board: board}} <- OperatelyWeb.Api.Tasks.BoardScope.select(me(conn), inputs) do
      {:ok, %{board: Serializer.serialize(board)}}
    end
  end
end
