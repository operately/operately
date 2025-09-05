defmodule Operately.Tasks.MilestoneSync do
  @moduledoc """
  Handles synchronization between tasks and milestone ordering state.
  """

  import Ecto.Query, only: [from: 2]
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Tasks.{Task, OrderingState}
  alias Operately.Projects.Milestone

  @doc """
  Handles milestone sync after task creation
  """
  def sync_after_task_create(multi, milestone_id) when is_nil(milestone_id), do: multi
  def sync_after_task_create(multi, milestone_id) do
    Multi.run(multi, :milestone_sync_create, fn _repo, changes ->
      with_milestone_lock(milestone_id, fn milestone ->
        task = get_task_from_changes(changes)
        ordering_state = OrderingState.load(milestone.tasks_ordering_state)
        updated_ordering = OrderingState.add_task(ordering_state, task)

        update_milestone_ordering(milestone, updated_ordering)
      end)
    end)
    |> Multi.run(:updated_milestone, &extract_milestone_from_sync/2)
  end

  @doc """
  Handles milestone sync after task status update
  """
  def sync_after_status_update(multi) do
    Multi.run(multi, :milestone_sync_status, fn _repo, changes ->
      task = Map.get(changes, :task) || Map.get(changes, :updated_task)
      updated_task = Map.get(changes, :updated_task)

      case task.milestone_id do
        nil -> {:ok, nil}
        milestone_id -> sync_status_change(milestone_id, task, updated_task)
      end
    end)
    |> Multi.run(:updated_milestone, &extract_milestone_from_sync/2)
  end

  @doc """
  Handles milestone sync after task deletion
  """
  def sync_after_task_delete(multi) do
    Multi.run(multi, :milestone_sync_delete, fn _repo, changes ->
      task = Map.get(changes, :task) || Map.get(changes, :delete_task)

      case task.milestone_id do
        nil -> {:ok, nil}
        milestone_id ->
          with_milestone_lock(milestone_id, fn milestone ->
            ordering_state = OrderingState.load(milestone.tasks_ordering_state)
            updated_ordering = OrderingState.remove_task(ordering_state, task)

            update_milestone_ordering(milestone, updated_ordering)
          end)
      end
    end)
    |> Multi.run(:updated_milestone, &extract_milestone_from_sync/2)
  end

  @doc """
  Handles milestone sync after task milestone change (move between milestones)
  """
  def sync_after_milestone_change(multi, new_milestone_id) do
    multi
    |> sync_remove_from_old_milestone(new_milestone_id)
    |> sync_add_to_new_milestone(new_milestone_id)
    |> Multi.run(:milestone_change_sync, &collect_updated_milestones/2)
  end

  @doc """
  Handles milestone sync for manual ordering updates
  """
  def sync_manual_ordering(multi, ordering_states) do
    Multi.run(multi, :milestone_sync_manual, fn _repo, _changes ->
      updated_milestones =
        ordering_states
        |> validate_and_filter_ordering_states()
        |> update_multiple_milestone_orderings()

      {:ok, updated_milestones}
    end)
  end

  #
  # Helpers
  #

  defp sync_remove_from_old_milestone(multi, nil), do: multi
  defp sync_remove_from_old_milestone(multi, new_milestone_id) do
    Multi.run(multi, :sync_remove_old, fn _repo, changes ->
      task = get_task_from_changes(changes)

      if task.milestone_id != new_milestone_id do
        with_milestone_lock(task.milestone_id, fn milestone ->
          ordering_state = OrderingState.load(milestone.tasks_ordering_state)
          updated_ordering = OrderingState.remove_task(ordering_state, task)

          update_milestone_ordering(milestone, updated_ordering)
        end)
      else
        {:ok, nil}
      end
    end)
  end

  defp sync_add_to_new_milestone(multi, nil), do: multi
  defp sync_add_to_new_milestone(multi, new_milestone_id) do
    Multi.run(multi, :sync_add_new, fn _repo, changes ->
      task = get_updated_task_from_changes(changes)

      if task.milestone_id != new_milestone_id do
        with_milestone_lock(new_milestone_id, fn milestone ->
          ordering_state = OrderingState.load(milestone.tasks_ordering_state)
          updated_ordering = OrderingState.add_task(ordering_state, task)

          update_milestone_ordering(milestone, updated_ordering)
        end)
      else
        {:ok, nil}
      end
    end)
  end

  defp sync_status_change(milestone_id, original_task, updated_task) do
    with_milestone_lock(milestone_id, fn milestone ->
      ordering_state = OrderingState.load(milestone.tasks_ordering_state)

      updated_ordering =
        case {task_should_be_in_ordering?(original_task), task_should_be_in_ordering?(updated_task)} do
          {true, false} ->
            OrderingState.remove_task(ordering_state, updated_task)

          {false, true} ->
            OrderingState.add_task(ordering_state, updated_task)

          _ ->
            # No change in ordering relevance
            ordering_state
        end

      update_milestone_ordering(milestone, updated_ordering)
    end)
  end

  defp task_should_be_in_ordering?(%{status: status}) when status in ["done", "canceled"], do: false
  defp task_should_be_in_ordering?(_task), do: true

  defp with_milestone_lock(milestone_id, callback) do
    query = from(m in Milestone, where: m.id == ^milestone_id, lock: "FOR UPDATE")

    case Repo.one(query) do
      nil -> {:ok, nil}
      milestone -> callback.(milestone)
    end
  end

  defp update_milestone_ordering(milestone, new_ordering_state) do
    changeset = Milestone.changeset(milestone, %{tasks_ordering_state: new_ordering_state})
    Repo.update(changeset)
  end

  defp validate_and_filter_ordering_states(ordering_states) do
    Enum.map(ordering_states, fn state ->
      case state.ordering_state do
        nil -> state
        [] -> state
        ordering ->
          {:ok, task_ids} = OperatelyWeb.Api.Helpers.decode_id(ordering)

          valid_tasks =
            from(t in Task,
              where: t.id in ^task_ids,
              where: t.milestone_id == ^state.milestone_id and t.status not in ["done", "canceled"]
            )
            |> Repo.all()

          valid_encoded_ids = Enum.map(valid_tasks, &OperatelyWeb.Paths.task_id/1) |> MapSet.new()
          filtered_ordering = Enum.filter(ordering, &MapSet.member?(valid_encoded_ids, &1))

          %{state | ordering_state: filtered_ordering}
      end
    end)
  end

  defp update_multiple_milestone_orderings(filtered_states) do
    milestone_ids = Enum.map(filtered_states, & &1.milestone_id)

    # Lock all milestones at once
    milestones =
      from(m in Milestone, where: m.id in ^milestone_ids, lock: "FOR UPDATE")
      |> Repo.all()
      |> Enum.reduce(%{}, fn milestone, acc ->
        Map.put(acc, milestone.id, milestone)
      end)

    # Update each milestone
    Enum.map(filtered_states, fn state ->
      milestone = Map.get(milestones, state.milestone_id)
      {:ok, updated_milestone} = update_milestone_ordering(milestone, state.ordering_state)
      updated_milestone
    end)
  end

  # Helper functions to extract the right task from Multi changes
  defp get_task_from_changes(changes) do
    Map.get(changes, :task) || Map.get(changes, :new_task)
  end

  defp get_updated_task_from_changes(changes) do
    Map.get(changes, :updated_task) || get_task_from_changes(changes)
  end

  defp extract_milestone_from_sync(_repo, changes) do
    milestone = case changes do
      %{milestone_sync_create: milestone} -> milestone
      %{milestone_sync_status: milestone} -> milestone
      %{milestone_sync_delete: milestone} -> milestone
      _ -> nil
    end

    {:ok, milestone}
  end

  defp collect_updated_milestones(_repo, changes) do
    milestones = [
      Map.get(changes, :sync_remove_old),
      Map.get(changes, :sync_add_new)
    ]
    |> Enum.filter(fn
      {:ok, milestone} when not is_nil(milestone) -> true
      _ -> false
    end)
    |> Enum.map(fn {:ok, milestone} -> milestone end)

    {:ok, milestones}
  end
end
