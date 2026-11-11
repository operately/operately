defmodule OperatelyWeb.Api.Tasks.GetBoard do
  @moduledoc "Returns a task board's name, archive state, statuses, and kanban ordering. Archived boards remain readable."
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :space_id, :id, null: false
    field :board_id, :id, null: false
  end

  outputs do
    field :board, :task_board, null: false
  end

  def call(conn, inputs) do
    with {:ok, space} <- Operately.Groups.Group.get(me(conn), id: inputs.space_id),
         {:ok, board} <- OperatelyWeb.Api.Tasks.BoardScope.resolve(me(conn), space, inputs.board_id) do
      {:ok, %{board: Serializer.serialize(board)}}
    end
  end
end
