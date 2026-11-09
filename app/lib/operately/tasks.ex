defmodule Operately.Tasks do
  import Ecto.Query, warn: false
  alias Ecto.Multi
  alias Operately.Repo

  alias Operately.Tasks.Task
  alias Operately.Tasks.Assignee

  def get_task!(id), do: Repo.get!(Task, id)

  def update_task(task, attrs \\ %{}), do: Task.changeset(task, attrs) |> Repo.update()

  def create_assignee(attrs \\ %{}) do
    Multi.new()
    |> Multi.insert(:assignee, Assignee.changeset(attrs))
    |> Multi.run(:subscription, fn _repo, %{assignee: assignee} ->
      task = Repo.get!(Task, assignee.task_id)
      Operately.Notifications.create_subscription(%{
        subscription_list_id: task.subscription_list_id,
        person_id: assignee.person_id,
        type: :invited,
      })
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{assignee: assignee}} -> {:ok, assignee}
      {:error, :assignee, changeset, _} -> {:error, changeset}
      {:error, :subscription, _reason, _} -> {:error, :subscription_creation_failed}
    end
  end

  def list_tasks(params \\ %{}) do
    from(t in Task)
    |> where(milestone_id: ^params.milestone_id)
    |> apply_if(params[:status], fn q -> where(q, status: ^params.status) end)
    |> Repo.all()
  end

  def list_task_assignees(task) do
    query = from(a in Assignee, where: a.task_id == ^task.id)
    Repo.all(query)
  end

  def create_task(attrs \\ %{}) do
    Multi.new()
    |> Multi.run(:board, fn _repo, _ -> creation_board(attrs) end)
    |> Multi.run(:task, fn _repo, %{board: board} ->
      with {:ok, attrs} <- creation_attrs(attrs, board) do
        attrs |> Task.changeset() |> Repo.insert()
      end
    end)
    |> Multi.run(:sync, fn _repo, %{task: task, board: board} -> Operately.Tasks.BoardSync.add_task(board, task) end)
    |> Repo.transaction()
    |> Repo.extract_result(:task)
  end

  defp creation_board(%{space_id: space_id} = attrs) when not is_nil(space_id) do
    case Repo.get(Operately.Groups.Group, space_id) do
      nil -> {:error, :not_found}
      space ->
        with {:ok, board} <- Operately.Tasks.TaskBoard.default_for_space(space),
             {:ok, boards} <- Operately.Tasks.BoardSync.lock_boards([attrs[:board_id] || board.id]) do
          {:ok, Map.fetch!(boards, attrs[:board_id] || board.id)}
        end
    end
  end

  defp creation_board(_attrs), do: {:ok, nil}

  defp creation_attrs(attrs, nil), do: {:ok, attrs}
  defp creation_attrs(attrs, board) do
    attrs = Map.put(attrs, :board_id, board.id)

    if attrs[:task_status] do
      {:ok, attrs}
    else
      case Operately.Tasks.TaskBoard.get_default_task_status(board) do
        nil -> {:error, :bad_request}
        status -> {:ok, Map.put(attrs, :task_status, Map.from_struct(status))}
      end
    end
  end

  defp apply_if(query, condition, fun) do
    if condition, do: fun.(query), else: query
  end
end
