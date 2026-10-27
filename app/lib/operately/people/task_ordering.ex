defmodule Operately.People.TaskOrdering do
  import Ecto.Query, only: [from: 2]

  alias Operately.People.Person
  alias Operately.Repo
  alias Operately.Tasks.Task

  def get(person) do
    ids = person.preferences.task_ordering || []
    allowed = available_task_ids(person, ids)
    Enum.filter(ids, &MapSet.member?(allowed, &1))
  end

  def update(person, ids) do
    allowed = available_task_ids(person, ids)

    if length(ids) == MapSet.size(allowed) && Enum.all?(ids, &MapSet.member?(allowed, &1)) && Enum.uniq(ids) == ids do
      Repo.transaction(fn ->
        # Reload under a lock so a request cannot overwrite newer preference values.
        current = Repo.one!(from p in Person, where: p.id == ^person.id, lock: "FOR UPDATE")

        current
        |> Person.changeset(%{preferences: %{task_ordering: ids}})
        |> Repo.update!()

        ids
      end)
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
