defmodule Operately.Operations.ResourceHubParentFolderEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.Node

  def run(author, resource, new_folder_id) do
    Multi.new()
    |> Multi.update(:node, Node.changeset(resource.node, %{parent_folder_id: new_folder_id}))
    |> Activities.insert_sync(author.id, :resource_hub_parent_folder_edited, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: resource.space.id,
        resource_hub_id: resource.node.resource_hub_id,
        node_id: resource.node.id,
        new_folder_id: new_folder_id,
        resource_id: resource.id,
        resource_type: Atom.to_string(resource.node.type),
      }
    end)
    |> Repo.transaction()
  end
end
