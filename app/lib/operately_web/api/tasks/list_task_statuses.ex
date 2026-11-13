defmodule OperatelyWeb.Api.Tasks.ListTaskStatuses do
  @moduledoc """
  Lists statuses for a task or a board, including empty boards. Supply task_id or board_id; if both are supplied they must match.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Tasks.Task
  alias OperatelyWeb.Api.Serializer

  inputs do
    field? :task_id, :id, null: true
    field? :board_id, :id, null: true
  end

  outputs do
    field :board_id, :id, null: true
    field :task_statuses, list_of(:task_status), null: false
  end

  def call(conn, inputs) do
    with {:ok, task} <- load_task(me(conn), inputs[:task_id]),
         {:ok, board} <- load_board(me(conn), inputs[:board_id]),
         :ok <- validate_selection(task, board) do
      statuses = if task, do: Task.available_statuses(task), else: board.task_statuses
      board_id = if task, do: task.board_id, else: board.id
      {:ok, %{task_statuses: Serializer.serialize(statuses || []), board_id: board_id && Operately.ShortUuid.encode!(board_id)}}
    end
  end

  defp load_task(_me, nil), do: {:ok, nil}
  defp load_task(me, id), do: Task.get(me, id: id, opts: [preload: [:project, :board]])

  defp load_board(_me, nil), do: {:ok, nil}
  defp load_board(me, id), do: Operately.Tasks.TaskBoard.get(me, id: id)

  defp validate_selection(nil, nil), do: {:error, :bad_request}
  defp validate_selection(nil, _board), do: :ok
  defp validate_selection(_task, nil), do: :ok
  defp validate_selection(task, board) do
    if task.board_id == board.id and Operately.Tasks.TaskBoard.owns_task?(board, task), do: :ok, else: {:error, :bad_request}
  end
end
