defmodule OperatelyWeb.Api.Tasks.BoardScope do
  @moduledoc false
  use Gettext, backend: OperatelyWeb.Gettext

  alias Operately.Tasks.{TaskBoard, BoardSummary}
  alias OperatelyWeb.Api.Serializer

  # Selectors can name an owner, a board, or both. An owner always refers to
  # direct ownership: a project's containing space is not the board's owner.
  def select(me, inputs) do
    with :ok <- validate_selectors(inputs),
         {:ok, owner} <- load_owner(me, inputs),
         {:ok, board} <- load_board(me, inputs[:board_id]),
         :ok <- validate_owner(board, owner),
         {:ok, owner} <- resolve_owner(me, owner, board) do
      {:ok, %{owner: owner, board: board}}
    end
  end

  defp validate_selectors(%{project_id: project, space_id: space}) when not is_nil(project) and not is_nil(space), do: {:error, :bad_request}

  defp validate_selectors(inputs) do
    if inputs[:project_id] || inputs[:space_id] || inputs[:board_id], do: :ok, else: {:error, :bad_request}
  end

  # Board queries remain readable on archived project pages. Mutation pipelines
  # load their owner separately and retain the active-project requirement.
  defp load_owner(me, %{project_id: id}) when not is_nil(id), do: Operately.Projects.Project.get(me, id: id, opts: [with_deleted: true])
  defp load_owner(me, %{space_id: id}) when not is_nil(id), do: Operately.Groups.Group.get(me, id: id)
  defp load_owner(_, _), do: {:ok, nil}
  defp load_board(_, nil), do: {:ok, nil}
  defp load_board(me, id), do: TaskBoard.get(me, id: id)

  defp resolve_owner(me, nil, board), do: load_owner(me, %{project_id: board.project_id, space_id: board.space_id})
  defp resolve_owner(_, owner, _), do: {:ok, owner}

  defp validate_owner(nil, _), do: :ok
  defp validate_owner(_, nil), do: :ok

  defp validate_owner(board, %Operately.Projects.Project{id: id}) do
    if board.project_id == id, do: :ok, else: {:error, :bad_request}
  end

  defp validate_owner(board, %Operately.Groups.Group{id: id}) do
    if board.space_id == id, do: :ok, else: {:error, :bad_request}
  end

  def list(me, owner, archive_status \\ :active) do
    {filters, default_id} =
      case owner do
        %Operately.Groups.Group{} -> {[space_id: owner.id], owner.default_task_board_id}
        %Operately.Projects.Project{} -> {[project_id: owner.id], nil}
      end

    TaskBoard.list(me, filters ++ [opts: [order_by: [asc: :position, asc: :id]]])
    |> Enum.filter(fn board ->
      case archive_status do
        :active -> is_nil(board.archived_at)
        :archived -> not is_nil(board.archived_at)
        :all -> true
      end
    end)
    |> Enum.map(&BoardSummary.build(&1, default_id))
  end

  def resolve(me, %Operately.Projects.Project{} = project, nil) do
    TaskBoard.get(me, project_id: project.id)
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

  def resolve(me, owner, board_id) do
    with {:ok, board} <- TaskBoard.get(me, id: board_id),
         :ok <- validate_owner(board, owner) do
      {:ok, board}
    end
  end
end
