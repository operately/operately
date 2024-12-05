defmodule Operately.Operations.ResourceHubFolderRenaming do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.Node

  def run(author, folder, new_name) do
    Multi.new()
    |> Multi.update(:node, Node.changeset(folder.node, %{
      name: new_name,
    }))
    |> Activities.insert_sync(author.id, :resource_hub_folder_renamed, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: folder.space.id,
        resource_hub_id: folder.resource_hub.id,
        node_id: folder.node.id,
        folder_id: folder.id,
        old_name: folder.node.name,
        new_name: new_name
      }
    end)
    |> Repo.transaction()
  end
end
