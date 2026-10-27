defmodule Operately.People.TaskOrdering do
  alias Operately.People
  alias Operately.Tasks.Task

  def get(person) do
    ids = person.preferences.task_ordering || []
    allowed = available_task_ids(person, ids)
    Enum.filter(ids, &MapSet.member?(allowed, &1))
  end

  def update(person, ids) do
    allowed = available_task_ids(person, ids)

    if length(ids) == MapSet.size(allowed) && Enum.all?(ids, &MapSet.member?(allowed, &1)) && Enum.uniq(ids) == ids do
      with {:ok, _person} <- People.update_person(person, %{preferences: %{task_ordering: ids}}) do
        {:ok, ids}
      end
    else
      {:error, :bad_request}
    end
  end

  defp available_task_ids(_person, []), do: MapSet.new()

  defp available_task_ids(person, ids) do
    Task.list(person, opts: [ids: ids, preload: [:assignees, :company, :project]])
    |> Enum.filter(fn task ->
      task.company.id == person.company_id &&
        Enum.any?(task.assignees, &(&1.person_id == person.id)) &&
        Task.state(task) == :active && is_nil(task.archived_at) &&
        (is_nil(task.project) || task.project.status == "active")
    end)
    |> MapSet.new(& &1.id)
  end
end
