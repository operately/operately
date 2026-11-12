defmodule OperatelyWeb.Api.Tasks.BoardScope do
  @moduledoc false
  use Gettext, backend: OperatelyWeb.Gettext

  alias Operately.Tasks.{TaskBoard, BoardSummary}
  alias OperatelyWeb.Api.Serializer

  def list(me, space, archive_status \\ :active) do
    TaskBoard.list(me, space_id: space.id, opts: [order_by: [asc: :position, asc: :id]])
    |> Enum.filter(fn board ->
      case archive_status do
        :active -> is_nil(board.archived_at)
        :archived -> not is_nil(board.archived_at)
        :all -> true
      end
    end)
    |> Enum.map(&BoardSummary.build(&1, space.default_task_board_id))
  end

  def resolve(me, space, nil) do
    case space.default_task_board_id && TaskBoard.get(me, id: space.default_task_board_id) do
      {:ok, %TaskBoard{space_id: space_id, archived_at: nil} = board} when space_id == space.id -> {:ok, board}
      _ ->
        {:error, {:bad_request,
          gettext("This space has no available default task board. Retry with board_id from the available boards."),
          %{code: "default_task_board_unavailable", candidates: Serializer.serialize(list(me, space))}}}
    end
  end

  def resolve(me, space, board_id) do
    with {:ok, board} <- TaskBoard.get(me, id: board_id),
         :ok <- validate_space(board, space) do
      {:ok, board}
    end
  end

  defp validate_space(board, space) do
    if board.space_id == space.id, do: :ok, else: {:error, :bad_request}
  end
end
