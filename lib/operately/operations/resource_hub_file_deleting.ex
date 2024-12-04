defmodule Operately.Operations.ResourceHubFileDeleting do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, file) do
    Multi.new()
    |> Multi.run(:file, fn _, _ -> Repo.soft_delete(file) end)
    |> Multi.run(:node, fn _, _ -> Repo.soft_delete(file.node) end)
    |> Activities.insert_sync(author.id, :resource_hub_file_deleted, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: file.resource_hub.space_id,
        resource_hub_id: file.resource_hub.id,
        node_id: file.node_id,
        file_id: file.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:file)
  end
end
