defmodule Operately.Operations.ResourceHubCreating do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.ResourceHub

  def run(author, space, attrs) do
    Multi.new()
    |> Multi.insert(:resource_hub, ResourceHub.changeset(%{
      space_id: space.id,
      name: attrs.name,
      description: attrs.description,
    }))
    |> Activities.insert_sync(author.id, :resource_hub_created, fn changes ->
      %{
        space_id: space.id,
        company_id: space.company_id,
        resource_hub_id: changes.resource_hub.id,
        name: changes.resource_hub.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:resource_hub)
  end
end
