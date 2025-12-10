defmodule Operately.Data.Change041CreateOneResourceHubForEachExistingSpace do
  import Ecto.Query, only: [from: 2]
  alias Operately.{Access, Repo}
  alias __MODULE__.{Space, ResourceHub}

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
    case ResourceHub.get(:system, space_id: space.id) do
      {:error, :not_found} ->
        {:ok, hub} =
          ResourceHub.changeset(%{
            space_id: space.id,
            name: "Resource Hub",
          })
          |> Repo.insert()

        {:ok, _} = Access.create_context(%{resource_hub_id: hub.id})

      {:ok, _} -> :ok
    end
  end

  defmodule Space do
    use Operately.Schema

    schema "groups" do
      field :company_id, :binary_id
    end
  end

  defmodule ResourceHub do
    use Operately.Schema
    use Operately.Repo.Getter

    schema "resource_hubs" do
      field :space_id, :binary_id
      field :name, :string
      field :description, :map

      request_info()
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
end
