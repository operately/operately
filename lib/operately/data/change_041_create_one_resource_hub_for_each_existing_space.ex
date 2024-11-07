defmodule Operately.Data.Change041CreateOneResourceHubForEachExistingSpace do
  import Ecto.Query, only: [from: 1]

  alias Operately.{Repo, ResourceHubs, Access}
  alias Operately.ResourceHubs.ResourceHub

  def run do
    Repo.transaction(fn ->
      from(Operately.Groups.Group)
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
        {:ok, hub} = ResourceHubs.create_resource_hub(%{
          space_id: space.id,
          name: "Resource Hub",
        })
        {:ok, _} = Access.create_context(%{resource_hub_id: hub.id})

      {:ok, _} -> :ok
    end
  end
end
