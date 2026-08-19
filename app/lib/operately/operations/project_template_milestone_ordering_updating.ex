defmodule Operately.Operations.ProjectTemplateMilestoneOrderingUpdating do
  @moduledoc """
  Moves a project-template task between milestones and updates list order.

  Writes only `tasks_ordering_state`. Root has no list, so a move to no milestone
  only updates membership and the source list.
  """

  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.ProjectTemplates.{Milestone, Task}
  alias Operately.Repo
  alias Operately.Tasks.OrderingState
  alias OperatelyWeb.Paths

  def run(template, task, milestone_id, index) do
    Multi.new()
    |> Multi.run(:validate_index, fn _repo, _changes -> validate_index(index) end)
    |> Multi.run(:validated_milestone, fn _repo, _changes -> validate_milestone(template, milestone_id) end)
    |> Multi.run(:updated_task, fn _repo, _changes -> update_task_milestone(task, milestone_id) end)
    |> Multi.run(:source_list, fn _repo, %{updated_task: updated_task} ->
      drop_from_source_list(template, task, updated_task)
    end)
    |> Multi.run(:destination_list, fn _repo, %{updated_task: updated_task} ->
      reorder_destination_list(template, updated_task, index)
    end)
  end

  defp validate_index(index) when is_integer(index) and index >= 0, do: {:ok, index}
  defp validate_index(_index), do: {:error, {:validation, "Task index must be zero or greater"}}

  defp validate_milestone(_template, nil), do: {:ok, nil}

  defp validate_milestone(template, milestone_id) do
    case Repo.get_by(Milestone, id: milestone_id, project_template_id: template.id) do
      nil -> {:error, {:not_found, :milestone}}
      milestone -> {:ok, milestone}
    end
  end

  defp update_task_milestone(task, milestone_id) do
    if task.project_template_milestone_id == milestone_id do
      {:ok, task}
    else
      task |> Task.changeset(%{project_template_milestone_id: milestone_id}) |> Repo.update()
    end
  end

  defp drop_from_source_list(template, original_task, updated_task) do
    source_id = original_task.project_template_milestone_id
    dest_id = updated_task.project_template_milestone_id

    if source_id && source_id != dest_id do
      persist_list(template, source_id)
    else
      {:ok, nil}
    end
  end

  defp reorder_destination_list(_template, %{project_template_milestone_id: nil}, _index), do: {:ok, nil}

  defp reorder_destination_list(template, task, index) do
    persist_list(template, task.project_template_milestone_id, fn ordering ->
      OrderingState.move_id(ordering, Paths.project_template_task_id(task), index)
    end)
  end

  defp persist_list(template, milestone_id, transform \\ &{:ok, &1}) do
    milestone = Repo.get_by!(Milestone, id: milestone_id, project_template_id: template.id)
    member_ids = member_ids(template.id, milestone_id)
    ordering = sync_list(milestone.tasks_ordering_state, member_ids)

    with {:ok, ordering} <- transform.(ordering) do
      milestone
      |> Milestone.changeset(%{tasks_ordering_state: ordering})
      |> Repo.update()
    end
  end

  defp member_ids(template_id, milestone_id) do
    from(t in Task,
      where: t.project_template_id == ^template_id and t.project_template_milestone_id == ^milestone_id,
      order_by: [asc: t.inserted_at, asc: t.id]
    )
    |> Repo.all()
    |> Enum.map(&Paths.project_template_task_id/1)
  end

  defp sync_list(stored, member_ids) do
    kept = stored |> List.wrap() |> Enum.filter(&(&1 in member_ids)) |> Enum.uniq()
    kept ++ (member_ids -- kept)
  end
end
