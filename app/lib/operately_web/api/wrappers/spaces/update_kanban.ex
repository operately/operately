defmodule OperatelyWeb.Api.Wrappers.Spaces.UpdateKanban do
  @moduledoc """
  Updates ordering and task status on the selected board, or the space’s default board when board_id is omitted.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups.Group, as: Space

  inputs do
    field :space_id, :id, null: false
    field? :board_id, :id, null: true
    field :task_id, :id, null: false
    field :status, :task_status, null: false
    field :kanban_state, :json, null: false
  end

  outputs do
    field :board_id, :id, null: false
    field :task, :task, null: false
  end

  def call(conn, inputs) do
    with {:ok, space} <- Space.get(me(conn), id: inputs.space_id),
         {:ok, board} <- OperatelyWeb.Api.Tasks.BoardScope.resolve(me(conn), space, inputs[:board_id]) do
      OperatelyWeb.Api.Tasks.UpdateBoardKanban.call(conn, Map.put(inputs, :board_id, board.id))
    else
      {:error, {:bad_request, message, details}} -> {:error, :bad_request, message, details}
      error -> error
    end
  end
end
