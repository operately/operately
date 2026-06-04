defmodule Operately.Data.Change041CreateOneResourceHubForEachExistingSpace do
  import Ecto.Query, only: [from: 2]
  alias Operately.Repo
  alias __MODULE__.{AccessContext, Space, ResourceHub}

  defmodule Space do
    use Operately.Schema

    schema "groups" do
      field :company_id, :binary_id
    end
  end

  defmodule ResourceHub do
    use Operately.Schema

    schema "resource_hubs" do
      field :space_id, :binary_id
      field :name, :string
      field :description, :map

      timestamps()
    end

    def changeset(attrs) do
      changeset(%__MODULE__{}, attrs)
    end

    def changeset(resource_hub, attrs) do
      resource_hub
      |> cast(attrs, [:space_id, :name, :description])
      |> validate_required([:space_id, :name])
    end
  end

  defmodule AccessContext do
    use Operately.Schema

    schema "access_contexts" do
      field :resource_hub_id, :binary_id

      timestamps()
    end

    def changeset(attrs) do
      changeset(%__MODULE__{}, attrs)
    end

    def changeset(context, attrs) do
      context
      |> cast(attrs, [:resource_hub_id])
      |> validate_required([:resource_hub_id])
    end
  end

  def run do
    Repo.transaction(fn ->
      from(s in Space, select: %{id: s.id})
      |> Repo.all()
      |> create_hubs()
    end)
  end

  defp create_hubs(spaces) when is_list(spaces) do
    Enum.each(spaces, &(create_hubs(&1)))
  end

  defp create_hubs(space) do
    case Repo.get_by(ResourceHub, space_id: space.id) do
      nil ->
        {:ok, hub} =
          ResourceHub.changeset(%{
            space_id: space.id,
            name: "Resource Hub",
          })
          |> Repo.insert()

        {:ok, _} =
          AccessContext.changeset(%{resource_hub_id: hub.id})
          |> Repo.insert()

      _ -> :ok
    end
  end
end
