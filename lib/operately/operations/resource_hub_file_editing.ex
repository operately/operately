defmodule Operately.Operations.ResourceHubFileEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.{File, Node}

  def run(author, file, attrs) do
    Multi.new()
    |> Multi.update(:file, File.changeset(file, %{description: attrs.description}))
    |> Multi.update(:node, Node.changeset(file.node, %{name: attrs.name}))
    |> Multi.run(:file_with_node, fn _, changes ->
      file = Map.put(changes.file, :node, changes.node)
      {:ok, file}
    end)
    |> Activities.insert_sync(author.id, :resource_hub_file_edited, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: file.resource_hub.space_id,
        resource_hub_id: file.resource_hub.id,
        node_id: file.node_id,
        file_id: file.id,
        old_name: file.node.name,
        new_name: attrs.name,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:file)
  end
end
