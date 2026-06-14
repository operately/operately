defmodule Operately.Data.Change101BackfillProjectResourceHubs do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{Project, ResourceHub}

  defmodule Project do
    use Operately.Schema

    schema "projects" do
      soft_delete()
      timestamps()
    end
  end

  defmodule ResourceHub do
    use Operately.Schema

    schema "resource_hubs" do
      field :project_id, :binary_id
      field :name, :string
      field :description, :map

      timestamps()
    end

    def changeset(resource_hub, attrs) do
      resource_hub
      |> cast(attrs, [:project_id, :name, :description])
      |> validate_required([:project_id, :name])
    end
  end

  def run do
    Repo.transaction(fn ->
      projects_missing_resource_hubs()
      |> Repo.all(with_deleted: true)
      |> Enum.each(&create_resource_hub/1)
    end)
  end

  defp projects_missing_resource_hubs do
    from(p in Project,
      left_join: h in ResourceHub,
      on: h.project_id == p.id,
      where: is_nil(h.id),
      select: %{id: p.id}
    )
  end

  defp create_resource_hub(project) do
    %ResourceHub{}
    |> ResourceHub.changeset(%{
      project_id: project.id,
      name: "Documents & Files",
    })
    |> Repo.insert!()
  end
end
