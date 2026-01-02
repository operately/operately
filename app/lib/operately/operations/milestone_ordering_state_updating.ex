defmodule Operately.Operations.MilestoneOrderingStateUpdating do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Activities
  alias Operately.Projects.Milestone
  alias Operately.Repo
  alias Operately.Tasks.Task
  alias OperatelyWeb.Api.Helpers

  def run(author, project, task, milestone_id, ordering_states) do
    Multi.new()
    |> Multi.run(:validate_task_parent, fn _repo, _changes ->
      validate_task_parent(project, task)
    end)
    |> Multi.run(:validated_milestone, fn _repo, _changes ->
      validate_milestone(project, milestone_id)
    end)
    |> Multi.run(:updated_task, fn _repo, %{validated_milestone: milestone} ->
      update_task_milestone(task, milestone_id, milestone)
    end)
    |> Multi.run(:validated_ordering_states, fn _repo, _changes ->
      validate_and_filter_ordering_states(project, ordering_states)
    end)
    |> Multi.run(:updated_milestones, fn _repo, %{validated_ordering_states: states} ->
      update_milestone_orderings(states)
    end)
    |> maybe_save_task_milestone_activity(author, project, task)
  end

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

  defp validate_and_filter_ordering_states(_project, nil), do: {:ok, []}
  defp validate_and_filter_ordering_states(project, ordering_states) do
    ordering_states = ordering_states || []

    with {:ok, decoded_states} <- decode_ordering_states(ordering_states),
         {:ok, milestones_by_id} <- load_milestones(project, Map.keys(decoded_states)) do
      states =
        decoded_states
        |> Enum.map(fn {milestone_id, ordering_state} ->
          milestone = Map.fetch!(milestones_by_id, milestone_id)
          filtered_ordering = filter_ordering_state(milestone_id, ordering_state)

          %{milestone: milestone, ordering_state: filtered_ordering}
        end)

      {:ok, states}
    end
  end

  defp decode_ordering_states(ordering_states) do
    Enum.reduce(ordering_states, {:ok, %{}}, fn state, {:ok, acc} ->
      case Helpers.decode_id(state.milestone_id) do
        {:ok, milestone_id} ->
          ordering_state = state.ordering_state || []
          {:ok, Map.put(acc, milestone_id, ordering_state)}

        _ ->
          {:error, {:bad_request, "Invalid milestone"}}
      end
    end)
  end

  defp load_milestones(_project, []), do: {:ok, %{}}
  defp load_milestones(project, milestone_ids) do
    milestones =
      from(m in Milestone,
        where: m.id in ^milestone_ids,
        where: m.project_id == ^project.id
      )
      |> Repo.all()

    if length(milestones) == length(milestone_ids) do
      {:ok, Map.new(milestones, fn milestone -> {milestone.id, milestone} end)}
    else
      {:error, {:bad_request, "Milestone must belong to the same project as the task"}}
    end
  end

  defp filter_ordering_state(_milestone_id, nil), do: []
  defp filter_ordering_state(milestone_id, ordering_state) do
    {decoded_ids, task_ids} = decode_task_ids(ordering_state)

    tasks =
      from(t in Task,
        where: t.id in ^task_ids,
        where: t.milestone_id == ^milestone_id
      )
      |> Repo.all()

    visible_tasks = Enum.filter(tasks, &task_visible?/1)
    valid_ids = MapSet.new(Enum.map(visible_tasks, & &1.id))
    encoded_by_id = Map.new(visible_tasks, fn task -> {task.id, OperatelyWeb.Paths.task_id(task)} end)

    {filtered, _seen} =
      Enum.reduce(decoded_ids, {[], MapSet.new()}, fn task_id, {acc, seen} ->
        if MapSet.member?(valid_ids, task_id) and not MapSet.member?(seen, task_id) do
          {[Map.fetch!(encoded_by_id, task_id) | acc], MapSet.put(seen, task_id)}
        else
          {acc, seen}
        end
      end)

    Enum.reverse(filtered)
  end

  defp decode_task_ids(ordering_state) do
    ordering_state = ordering_state || []

    decoded_ids =
      Enum.reduce(ordering_state, [], fn encoded_id, acc ->
        case Helpers.decode_id(encoded_id) do
          {:ok, task_id} -> [task_id | acc]
          _ -> acc
        end
      end)
      |> Enum.reverse()

    {decoded_ids, Enum.uniq(decoded_ids)}
  end

  defp task_visible?(%Task{task_status: %{closed: true}}), do: false
  defp task_visible?(%Task{closed_at: closed_at}) when not is_nil(closed_at), do: false
  defp task_visible?(%Task{status: status}) when status in ["done", "canceled"], do: false
  defp task_visible?(_task), do: true

  defp update_milestone_orderings([]), do: {:ok, []}
  defp update_milestone_orderings(states) do
    Enum.reduce_while(states, {:ok, []}, fn %{milestone: milestone, ordering_state: ordering_state}, {:ok, acc} ->
      case Operately.Projects.update_milestone(milestone, %{tasks_ordering_state: ordering_state}) do
        {:ok, updated_milestone} -> {:cont, {:ok, [updated_milestone | acc]}}
        {:error, changeset} -> {:halt, {:error, changeset}}
      end
    end)
    |> case do
      {:ok, updated_milestones} -> {:ok, Enum.reverse(updated_milestones)}
      error -> error
    end
  end

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
