defmodule Operately.Operations.ResourceHubCreating do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Access.Context
  alias Operately.ResourceHubs.{ResourceHub, SpaceHub}

  def run(author, space, attrs) do
    Multi.new()
    |> Multi.insert(
      :resource_hub,
      ResourceHub.changeset(%{
        space_id: space.id,
        name: attrs.name,
        description: attrs.description
      })
    )
    |> Multi.insert(:context, fn changes ->
      Context.changeset(%{
        resource_hub_id: changes.resource_hub.id
      })
    end)
    |> sync_access_from_space()
    |> Activities.insert_sync(author.id, :resource_hub_created, fn changes ->
      %{
        space_id: space.id,
        company_id: space.company_id,
        resource_hub_id: changes.resource_hub.id,
        name: changes.resource_hub.id
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:resource_hub)
  end

  defp sync_access_from_space(multi) do
    Multi.run(multi, :resource_hub_access, fn _, %{resource_hub: hub} ->
      {:ok, SpaceHub.sync_access_from_hub!(hub)}
    end)
  end
end
