defmodule Operately.Operations.MilestoneOrderingStateUpdating do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Activities
  alias Operately.Projects.Milestone
  alias Operately.Repo
  alias Operately.Tasks.OrderingState
  alias Operately.Tasks.Task
  alias OperatelyWeb.Paths

  def run(author, project, task, milestone_id, index) do
    Multi.new()
    |> Multi.run(:validate_index, fn _repo, _changes ->
      validate_index(index)
    end)
    |> Multi.run(:validate_task_parent, fn _repo, _changes ->
      validate_task_parent(project, task)
    end)
    |> Multi.run(:validated_milestone, fn _repo, _changes ->
      validate_milestone(project, milestone_id)
    end)
    |> Multi.run(:updated_task, fn _repo, %{validated_milestone: milestone} ->
      update_task_milestone(task, milestone_id, milestone)
    end)
    |> Multi.run(:updated_milestones, fn _repo, %{updated_task: updated_task} ->
      apply_list_move(project, task, updated_task, index)
    end)
    |> maybe_save_task_milestone_activity(author, project, task)
  end

  defp validate_index(index) when is_integer(index) and index >= 0, do: {:ok, index}
  defp validate_index(_index), do: {:error, {:validation, "Task index must be zero or greater"}}

  defp validate_task_parent(project, task) do
    if task.project_id == project.id do
      {:ok, :ok}
    else
      {:error, :not_found}
    end
  end

  defp validate_milestone(_project, nil), do: {:ok, nil}

  defp validate_milestone(project, milestone_id) do
    case Repo.get(Milestone, milestone_id) do
      nil ->
        {:error, {:not_found, "Milestone not found"}}

      milestone ->
        if milestone.project_id == project.id do
          {:ok, milestone}
        else
          {:error, {:bad_request, "Milestone must belong to the same project as the task"}}
        end
    end
  end

  defp update_task_milestone(task, milestone_id, milestone) do
    if task.milestone_id == milestone_id do
      {:ok, task}
    else
      case Operately.Tasks.update_task(task, %{milestone_id: milestone_id}) do
        {:ok, updated_task} -> {:ok, Map.put(updated_task, :milestone, milestone)}
        {:error, changeset} -> {:error, changeset}
      end
    end
  end

  defp apply_list_move(project, original_task, updated_task, index) do
    source_id = original_task.milestone_id
    destination_id = updated_task.milestone_id
    task_id = Paths.task_id(updated_task)

    milestone_ids = Enum.uniq(Enum.reject([source_id, destination_id], &is_nil/1))
    milestones = load_project_milestones(project, milestone_ids)

    Enum.reduce_while(milestone_ids, {:ok, []}, fn milestone_id, {:ok, acc} ->
      milestone = Map.fetch!(milestones, milestone_id)
      ordering = visible_ordering(milestone)

      next_ordering =
        if milestone_id == destination_id and task_visible?(updated_task) do
          case OrderingState.move_id(ordering, task_id, index) do
            {:ok, moved} -> moved
            {:error, error} -> error
          end
        else
          Enum.reject(ordering, &(&1 == task_id))
        end

      case next_ordering do
        {:validation, _} = error ->
          {:halt, {:error, error}}

        ordering_state when is_list(ordering_state) ->
          case Operately.Projects.update_milestone(milestone, %{tasks_ordering_state: ordering_state}) do
            {:ok, updated_milestone} -> {:cont, {:ok, [updated_milestone | acc]}}
            {:error, changeset} -> {:halt, {:error, changeset}}
          end
      end
    end)
    |> case do
      {:ok, updated_milestones} -> {:ok, Enum.reverse(updated_milestones)}
      error -> error
    end
  end

  defp load_project_milestones(_project, []), do: %{}

  defp load_project_milestones(project, milestone_ids) do
    from(m in Milestone, where: m.id in ^milestone_ids, where: m.project_id == ^project.id)
    |> Repo.all()
    |> Map.new(&{&1.id, &1})
  end

  defp visible_ordering(milestone) do
    visible_ids =
      from(t in Task, where: t.milestone_id == ^milestone.id, order_by: [asc: t.inserted_at, asc: t.id])
      |> Repo.all()
      |> Enum.filter(&task_visible?/1)
      |> Enum.map(&Paths.task_id/1)

    ordering = OrderingState.load(milestone.tasks_ordering_state)
    kept = ordering |> Enum.filter(&(&1 in visible_ids)) |> Enum.uniq()
    kept ++ (visible_ids -- kept)
  end

  defp task_visible?(%Task{task_status: %{closed: true}}), do: false
  defp task_visible?(%Task{closed_at: closed_at}) when not is_nil(closed_at), do: false
  defp task_visible?(%Task{status: status}) when status in ["done", "canceled"], do: false
  defp task_visible?(_task), do: true

  defp maybe_save_task_milestone_activity(multi, author, project, task) do
    Multi.merge(multi, fn changes ->
      if task.milestone_id != changes.updated_task.milestone_id do
        Activities.insert_sync(Multi.new(), author.id, :task_milestone_updating, fn _ ->
          %{
            company_id: project.company_id,
            space_id: project.group_id,
            project_id: project.id,
            task_id: task.id,
            old_milestone_id: task.milestone_id,
            new_milestone_id: changes.updated_task.milestone_id
          }
        end)
      else
        Multi.new()
      end
    end)
  end
end
