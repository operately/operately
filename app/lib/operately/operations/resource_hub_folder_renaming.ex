defmodule Operately.Operations.ResourceHubFolderRenaming do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.{Folder, Parent}

  def run(author, folder, new_name) do
    Multi.new()
    |> Multi.update(:folder, Folder.changeset(folder, %{name: new_name}))
    |> Activities.insert_sync(author.id, :resource_hub_folder_renamed, fn _changes ->
      %{
        resource_hub_id: folder.resource_hub.id,
        node_id: folder.node.id,
        folder_id: folder.id,
        old_name: folder.name,
        new_name: new_name
      }
      |> Map.merge(Parent.parent_fields(folder.resource_hub))
    end)
    |> Repo.transaction()
  end
end
