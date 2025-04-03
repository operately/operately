defmodule Operately.Operations.ResourceHubFolderDeleting do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, folder) do
    Multi.new()
    |> Multi.run(:folder, fn _, _ -> Repo.soft_delete(folder) end)
    |> Multi.run(:node, fn _, _ -> Repo.soft_delete(folder.node) end)
    |> Activities.insert_sync(author.id, :resource_hub_folder_deleted, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: folder.resource_hub.space_id,
        resource_hub_id: folder.resource_hub.id,
        node_id: folder.node_id,
        folder_id: folder.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:folder)
  end
end
