defmodule Operately.Data.Change090PopulateDefaultTaskStatusesForSpaces do
  @moduledoc """
  Populates default task statuses for spaces that don't have any.
  Spaces (groups) with existing task_statuses are left unchanged.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Tasks.Status
  alias __MODULE__.Group

  def run do
    Repo.transaction(fn ->
      fetch_groups_without_task_statuses()
      |> populate_task_statuses()
    end)
  end

  defp fetch_groups_without_task_statuses do
    from(g in Group,
      where: is_nil(g.task_statuses) or g.task_statuses == []
    )
    |> Repo.all()
  end

  defp populate_task_statuses(groups) do
    default_statuses = Status.default_task_statuses()

    Enum.each(groups, fn group ->
      statuses_as_maps = Enum.map(default_statuses, &Map.from_struct/1)

      from(g in Group, where: g.id == ^group.id)
      |> Repo.update_all(set: [task_statuses: statuses_as_maps])
    end)

    :ok
  end

  defmodule Group do
    use Operately.Schema

    schema "groups" do
      field :task_statuses, {:array, :map}
    end
  end
end
