defmodule Operately.ProjectTemplates.Resources.ReverseCopy do
  import Ecto.Query

  alias Operately.ProjectTemplates.{ResourceDocument, ResourceFile, ResourceFolder, ResourceLink, ResourceNode}
  alias Operately.ResourceHubs.{Document, File, Folder, Link, Node, ResourceHub}
  alias Operately.ProjectTemplates.Resources.Tree

  def run(repo, project_id, template) do
    with %{id: hub_id} <- repo.one(from hub in ResourceHub, where: hub.project_id == ^project_id),
         nodes <- load_source_nodes(repo, hub_id) do
      copy_nodes(repo, nodes, template)
    else
      nil -> {:ok, []}
    end
  end

  defp load_source_nodes(repo, hub_id) do
    from(node in Node,
      where: node.resource_hub_id == ^hub_id and is_nil(node.deleted_at),
      left_join: folder in Folder,
      on: folder.node_id == node.id and is_nil(folder.deleted_at),
      left_join: document in Document,
      on: document.node_id == node.id and is_nil(document.deleted_at) and document.state == :published,
      left_join: file in File,
      on: file.node_id == node.id and is_nil(file.deleted_at),
      left_join: link in Link,
      on: link.node_id == node.id and is_nil(link.deleted_at),
      preload: [folder: folder, document: {document, [:author]}, file: {file, [:author, :blob, :preview_blob]}, link: {link, [:author]}]
    )
    |> repo.all()
    |> Enum.filter(&copyable_node?/1)
    |> remove_orphaned_nodes()
    |> assign_positions()
  end

  defp copy_nodes(repo, source_nodes, template) do
    source_nodes
    |> Tree.sort_by_depth()
    |> Enum.reduce_while({:ok, [], %{}}, fn source, {:ok, copied, folder_ids} ->
      attrs = %{
        project_template_id: template.id,
        parent_folder_id: Tree.remapped_parent_id!(source, folder_ids),
        type: source.type,
        position: source.position
      }

      with {:ok, node} <- insert_node(repo, attrs),
           {:ok, content} <- insert_content(repo, source, node.id) do
        folder_ids = Tree.remember_folder_id(folder_ids, source, content)
        {:cont, {:ok, [node | copied], folder_ids}}
      else
        {:error, reason} -> {:halt, {:error, reason}}
      end
    end)
    |> then(fn
      {:ok, nodes, _folder_ids} -> {:ok, Enum.reverse(nodes)}
      error -> error
    end)
  end

  defp insert_node(repo, attrs) do
    case repo.insert(ResourceNode.changeset(attrs)) do
      {:ok, node} -> {:ok, node}
      {:error, changeset} -> {:error, {:invalid_resource_tree, changeset}}
    end
  end

  # Runtime resources derive their sibling order from display timestamps, while
  # templates persist it explicitly. Position zero is the newest resource in
  # each parent, with the node ID providing a deterministic timestamp tie-break.
  defp assign_positions(nodes) do
    nodes
    |> Enum.group_by(& &1.parent_folder_id)
    |> Enum.flat_map(fn {_parent, children} ->
      children
      |> Enum.sort_by(fn node -> {DateTime.to_unix(display_time(node)), node.id} end, :desc)
      |> Enum.with_index()
      |> Enum.map(fn {node, position} -> Map.put(node, :position, position) end)
    end)
  end

  defp display_time(%{type: :document, document: document}) when not is_nil(document), do: Operately.Drafts.display_date(document)
  defp display_time(node), do: Operately.Time.as_datetime(node.inserted_at)

  defp copyable_node?(%{type: :folder, folder: folder}) when not is_nil(folder), do: true
  defp copyable_node?(%{type: :document, document: document}) when not is_nil(document), do: true
  defp copyable_node?(%{type: :file, file: file}) when not is_nil(file), do: true
  defp copyable_node?(%{type: :link, link: link}) when not is_nil(link), do: true
  defp copyable_node?(_node), do: false

  defp remove_orphaned_nodes(nodes) do
    folder_ids = nodes |> Enum.filter(&Tree.folder_node?/1) |> MapSet.new(& &1.folder.id)
    remaining = Enum.filter(nodes, fn node -> is_nil(node.parent_folder_id) or MapSet.member?(folder_ids, node.parent_folder_id) end)

    if length(remaining) == length(nodes), do: remaining, else: remove_orphaned_nodes(remaining)
  end

  defp insert_content(repo, %{type: :folder, folder: folder}, node_id),
    do: repo.insert(ResourceFolder.changeset(%{node_id: node_id, name: folder.name}))

  defp insert_content(repo, %{type: :document, document: document}, node_id),
    do: repo.insert(ResourceDocument.changeset(%{node_id: node_id, author_id: document.author_id, name: document.name, content: document.content}))

  defp insert_content(repo, %{type: :file, file: file}, node_id),
    do:
      repo.insert(
        ResourceFile.changeset(%{
          node_id: node_id,
          author_id: file.author_id,
          blob_id: file.blob_id,
          preview_blob_id: file.preview_blob_id,
          name: file.name,
          description: file.description
        })
      )

  defp insert_content(repo, %{type: :link, link: link}, node_id),
    do: repo.insert(ResourceLink.changeset(%{node_id: node_id, author_id: link.author_id, name: link.name, url: link.url, description: link.description, type: link.type}))
end
