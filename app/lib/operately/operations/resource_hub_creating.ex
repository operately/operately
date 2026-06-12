defmodule Operately.Operations.ResourceHubCreating do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.ResourceHub
  alias Operately.ResourceHubs.Parent

  def run(author, parent, attrs) do
    Multi.new()
    |> Multi.insert(:resource_hub, ResourceHub.changeset(%{
      name: attrs.name,
      description: attrs.description,
    } |> Map.merge(Parent.resource_hub_fields(parent))))
    |> Activities.insert_sync(author.id, :resource_hub_created, fn changes ->
      %{
        resource_hub_id: changes.resource_hub.id,
        name: changes.resource_hub.id,
      }
      |> Map.merge(Parent.parent_fields(parent))
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:resource_hub)
  end
end
