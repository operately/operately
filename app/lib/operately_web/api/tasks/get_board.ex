defmodule OperatelyWeb.Api.Tasks.GetBoard do
  @moduledoc "Returns a task board by board_id, or a project's sole board by project_id. Archived boards remain readable. Optional owner selectors must match."
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers
  alias OperatelyWeb.Api.Tasks.BoardScope

  inputs do
    field? :space_id, :id, null: true
    field? :project_id, :id, null: true
    field? :board_id, :id, null: true
  end

  outputs do
    field :board, :task_board, null: false
  end

  def call(conn, inputs) do
    with {:ok, %{owner: owner, board: board}} <- BoardScope.select(me(conn), inputs),
         {:ok, board} <- resolve_board(me(conn), owner, board) do
      {:ok, %{board: Serializer.serialize(board)}}
    end
  end

  defp resolve_board(me, %Operately.Projects.Project{} = project, nil), do: BoardScope.resolve(me, project, nil)
  defp resolve_board(_, _, nil), do: {:error, :bad_request}
  defp resolve_board(_, _, board), do: {:ok, board}
end
