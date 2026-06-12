defmodule Operately.Operations.ResourceHubFileDeleting do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.Parent

  def run(author, file) do
    Multi.new()
    |> Multi.run(:file, fn _, _ -> Repo.soft_delete(file) end)
    |> Multi.run(:node, fn _, _ -> Repo.soft_delete(file.node) end)
    |> Activities.insert_sync(author.id, :resource_hub_file_deleted, fn _changes ->
      %{
        resource_hub_id: file.resource_hub.id,
        node_id: file.node_id,
        file_id: file.id,
      }
      |> Map.merge(Parent.parent_fields(file.resource_hub))
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:file)
  end
end
