defmodule Operately.Data.Change087PopulateDefaultTaskStatuses do
  @moduledoc """
  Populates default task statuses for projects that don't have any.
  Projects with existing task_statuses are left unchanged.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Tasks.Status
  alias __MODULE__.Project

  def run do
    Repo.transaction(fn ->
      fetch_projects_without_task_statuses()
      |> populate_task_statuses()
    end)
  end

  defp fetch_projects_without_task_statuses do
    # Projects where task_statuses is nil or an empty list
    from(p in Project,
      where: is_nil(p.task_statuses) or p.task_statuses == []
    )
    |> Repo.all()
  end

  defp populate_task_statuses(projects) do
    default_statuses = Status.default_task_statuses()

    Enum.each(projects, fn project ->
      # Convert TaskStatus structs to maps for embedding
      statuses_as_maps = Enum.map(default_statuses, &Map.from_struct/1)

      from(p in Project, where: p.id == ^project.id)
      |> Repo.update_all(set: [task_statuses: statuses_as_maps])
    end)

    :ok
  end

  defmodule Project do
    use Operately.Schema

    schema "projects" do
      field :task_statuses, {:array, :map}
    end
  end
end
