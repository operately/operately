defmodule OperatelyWeb.Api.Tasks.UpdateBoardKanban do
  @moduledoc "Updates task status and ordering on a project or space board. Milestone-specific ordering remains separate."
  use TurboConnect.Mutation
  use Gettext, backend: OperatelyWeb.Gettext
  use OperatelyWeb.Api.Helpers
  alias Ecto.Multi
  alias OperatelyWeb.Api.Tasks.BoardMultiSteps, as: Steps
  alias OperatelyWeb.Api.Tasks.SharedMultiSteps, as: TaskSteps

  inputs do
    field :board_id, :id, null: false
    field :task_id, :id, null: false
    field :status, :task_status, null: false
    field :kanban_state, :json, null: false
  end

  outputs do
    field :board_id, :id, null: false
    field :task, :task, null: false
  end

  def call(conn, inputs) do
    Steps.start(conn, inputs.board_id)
    |> find_task(inputs.task_id)
    |> update_kanban(inputs.status, inputs.kanban_state)
    |> Steps.commit()
    |> TaskSteps.broadcast_project_update()
    |> broadcast_review_count_update()
    |> Steps.respond(fn changes ->
      %{task: Serializer.serialize(changes.updated_task_with_preloads, level: :full), board_id: Operately.ShortUuid.encode!(changes.board.id)}
    end)
  end

  defp update_kanban(multi, status, kanban_state) do
    Multi.merge(multi, fn changes ->
      scope =
        case changes do
          %{project: project} -> %{type: :project, project: project}
          %{space: space, board: board} -> %{type: :space, space: space, board: board}
        end

      Operately.Operations.KanbanStateUpdating.run(changes.me, scope, changes.task, status, kanban_state)
    end)
  end

  defp find_task(multi, task_id) do
    Multi.run(multi, :task, fn _repo, %{me: me} ->
      case Operately.Tasks.Task.get(me, id: task_id, opts: [preload: [:assigned_people]]) do
        {:ok, task} -> {:ok, task}
        {:error, _} -> {:error, {:not_found, gettext("Task not found")}}
      end
    end)
  end

  defp broadcast_review_count_update(result) do
    case result do
      {:ok, %{task: task, updated_task_with_preloads: updated_task}} ->
        (task.assigned_people ++ updated_task.assigned_people)
        |> Enum.uniq_by(& &1.id)
        |> Enum.each(fn person ->
          OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: person.id)
        end)

      _result ->
        :ok
    end

    result
  end
end
