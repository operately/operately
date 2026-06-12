defmodule Operately.Operations.ResourceHubFileEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.Parent
  alias Operately.ResourceHubs.{File, Node}

  def run(author, file, attrs) do
    Multi.new()
    |> Multi.update(:file, File.changeset(file, %{description: attrs.description}))
    |> Multi.update(:node, fn changes ->
      Node.changeset(file.node, %{
        name: attrs.name,
        updated_at: changes.file.updated_at
      })
    end)
    |> Multi.run(:file_with_node, fn _, changes ->
      file = Map.put(changes.file, :node, changes.node)
      {:ok, file}
    end)
    |> Activities.insert_sync(author.id, :resource_hub_file_edited, fn _changes ->
      %{
        resource_hub_id: file.resource_hub.id,
        node_id: file.node_id,
        file_id: file.id,
        old_name: file.node.name,
        new_name: attrs.name
      }
      |> Map.merge(Parent.parent_fields(file.resource_hub))
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:file_with_node)
  end
end
