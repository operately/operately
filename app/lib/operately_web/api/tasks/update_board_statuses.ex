defmodule OperatelyWeb.Api.Tasks.UpdateBoardStatuses do
  @moduledoc "Updates a board's available task statuses, replacing deleted statuses in use when a mapping is supplied."
  use TurboConnect.Mutation
  use Gettext, backend: OperatelyWeb.Gettext
  import Ecto.Query, only: [from: 2]
  alias Ecto.Multi
  alias Operately.Repo
  alias OperatelyWeb.Api.Tasks.BoardMultiSteps, as: Steps
  alias OperatelyWeb.Api.Tasks.SharedMultiSteps, as: TaskSteps

  inputs do
    field :board_id, :id, null: false
    field :task_statuses, list_of(:task_status), null: false
    field? :deleted_status_replacements, list_of(:deleted_status_replacement), null: true
  end

  outputs do
    field :board_id, :id, null: false
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    replacements = inputs[:deleted_status_replacements] || []

    Steps.start(conn, inputs.board_id)
    |> validate_status_replacements(inputs.task_statuses, replacements)
    |> require_status_replacements(inputs.task_statuses, replacements)
    |> update_task_statuses(inputs.task_statuses)
    |> replace_deleted_task_statuses(replacements)
    |> Steps.commit()
    |> TaskSteps.broadcast_project_update()
    |> Steps.respond(fn changes -> %{success: true, board_id: Operately.ShortUuid.encode!(changes.board.id)} end)
  end

  defp update_task_statuses(multi, task_statuses) do
    case task_statuses do
      [] ->
        Multi.run(multi, :validate_task_statuses, fn _repo, _changes ->
          {:error, gettext("At least one task status is required")}
        end)

      _ ->
        Multi.update(multi, :updated_board, fn %{board: board} ->
          Operately.Tasks.TaskBoard.changeset(board, %{task_statuses: task_statuses})
        end)
    end
  end

  defp require_status_replacements(multi, task_statuses, replacements) do
    Multi.run(multi, :require_status_replacements, fn _repo, %{board: board} ->
      if Operately.Tasks.Status.replacement_required?(board, task_statuses, replacements) do
        {:error, :replacement_required}
      else
        {:ok, :valid}
      end
    end)
  end

  defp validate_status_replacements(multi, _task_statuses, []), do: multi

  defp validate_status_replacements(multi, task_statuses, replacements) do
    Multi.run(multi, :validate_replacements, fn _repo, _changes ->
      new_status_ids = MapSet.new(task_statuses, & &1.id)
      deleted_status_ids = MapSet.new(replacements, & &1.deleted_status_id)

      invalid_replacements =
        Enum.filter(replacements, fn r ->
          replacement_is_deleted = MapSet.member?(deleted_status_ids, r.replacement_status_id)
          replacement_not_in_new_statuses = not MapSet.member?(new_status_ids, r.replacement_status_id)

          replacement_is_deleted or replacement_not_in_new_statuses
        end)

      if Enum.empty?(invalid_replacements) do
        {:ok, :valid}
      else
        {:error, gettext("Replacement statuses must be existing statuses that are not being deleted")}
      end
    end)
  end

  defp replace_deleted_task_statuses(multi, []), do: multi

  defp replace_deleted_task_statuses(multi, replacements) do
    Multi.run(multi, :replace_task_statuses, fn _repo, changes ->
      board = changes.updated_board

      replacement_map =
        Map.new(replacements, fn r -> {r.deleted_status_id, r.replacement_status_id} end)

      deleted_status_ids = Map.keys(replacement_map)

      tasks =
        from(t in Operately.Tasks.Task,
          where: t.board_id == ^board.id,
          order_by: t.id,
          lock: "FOR UPDATE",
          where: fragment("?->>'id' = ANY(?)", t.task_status, ^deleted_status_ids)
        )
        |> Repo.all()

      new_statuses_by_id = Map.new(board.task_statuses, fn s -> {s.id, s} end)

      Enum.reduce_while(tasks, {:ok, board}, fn task, {:ok, board} ->
        replacement_id = Map.fetch!(replacement_map, task.task_status.id)
        status = Map.fetch!(new_statuses_by_id, replacement_id)
        attrs = Operately.Tasks.Task.status_change_attrs(task, status)

        with {:ok, updated} <- task |> Operately.Tasks.Task.changeset(attrs) |> Repo.update(),
             {:ok, board} <- Operately.Tasks.BoardSync.add_task(board, updated) do
          {:cont, {:ok, board}}
        else
          error -> {:halt, error}
        end
      end)
      |> case do
        {:ok, _board} -> {:ok, Enum.map(tasks, & &1.id)}
        error -> error
      end
    end)
    |> Operately.Search.IndexUpdates.enqueue(:search_tasks_with_replaced_status, "task", fn changes -> changes.replace_task_statuses end)
  end
end
