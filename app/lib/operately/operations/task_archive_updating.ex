defmodule Operately.Operations.TaskArchiveUpdating do
  import Ecto.Query
  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.Tasks.Task

  def run(author, task, archived) do
    Multi.new()
    |> Multi.run(:locked_task, fn repo, _ ->
      {:ok, repo.one!(from t in Task, where: t.id == ^task.id, lock: "FOR UPDATE")}
    end)
    |> Multi.run(:task, fn repo, %{locked_task: current} ->
      cond do
        archived && !(current.task_status && current.task_status.closed) ->
          {:error, :bad_request}

        archived == not is_nil(current.archived_at) ->
          {:ok, current}

        true ->
          archived_at = if archived, do: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
          current |> Ecto.Changeset.change(archived_at: archived_at) |> repo.update()
      end
    end)
    |> Multi.merge(fn %{locked_task: previous, task: updated} ->
      if previous.archived_at == updated.archived_at do
        Multi.new()
      else
        Activities.insert_sync(Multi.new(), author.id, :task_archive_updating, fn _ ->
          %{
            company_id: author.company_id,
            space_id: task.space_id || task.project.group_id,
            project_id: task.project_id,
            task_id: task.id,
            name: task.name,
            archived: archived
          }
        end)
      end
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{task: updated}} -> {:ok, updated}
      {:error, _step, reason, _changes} -> {:error, reason}
    end
  end
end
