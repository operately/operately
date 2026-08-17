defmodule Operately.ProjectTemplates.Resources.Duplication do
  alias Operately.ProjectTemplates.{ResourceDocument, ResourceFile, ResourceFolder, ResourceLink, ResourceNode}
  alias Operately.ProjectTemplates.Resources.Tree

  def run(repo, source_nodes, template) do
    source_nodes
    |> Tree.sort_by_depth()
    |> Enum.reduce_while({:ok, [], %{}, empty_parent_ids()}, fn source, {:ok, copied, folder_ids, parent_ids} ->
      attrs = %{
        id: Ecto.UUID.generate(),
        project_template_id: template.id,
        parent_folder_id: Tree.remapped_parent_id!(source, folder_ids),
        type: source.type,
        position: source.position
      }

      with {:ok, node} <- insert_node(repo, attrs),
           {:ok, content} <- insert_content(repo, source, node.id) do
        folder_ids = Tree.remember_folder_id(folder_ids, source, content)
        parent_ids = remember_parent_id(parent_ids, source, content)
        {:cont, {:ok, [node | copied], folder_ids, parent_ids}}
      else
        {:error, reason} -> {:halt, {:error, reason}}
      end
    end)
    |> then(fn
      {:ok, nodes, _folder_ids, parent_ids} -> {:ok, %{nodes: Enum.reverse(nodes), parent_ids: parent_ids}}
      error -> error
    end)
  end

  defp empty_parent_ids, do: %{document: %{}, file: %{}, link: %{}}

  defp remember_parent_id(parent_ids, %{type: :document, document: source}, copied), do: put_in(parent_ids, [:document, source.id], copied.id)
  defp remember_parent_id(parent_ids, %{type: :file, file: source}, copied), do: put_in(parent_ids, [:file, source.id], copied.id)
  defp remember_parent_id(parent_ids, %{type: :link, link: source}, copied), do: put_in(parent_ids, [:link, source.id], copied.id)
  defp remember_parent_id(parent_ids, _source, _copied), do: parent_ids

  defp insert_node(repo, attrs) do
    case repo.insert(ResourceNode.changeset(attrs)) do
      {:ok, node} -> {:ok, node}
      {:error, changeset} -> {:error, {:invalid_child, :resource_node, changeset}}
    end
  end

  defp insert_content(repo, %{type: :folder, folder: source}, node_id) do
    insert(repo, ResourceFolder.changeset(%{id: Ecto.UUID.generate(), node_id: node_id, name: source.name}), :resource_folder)
  end

  defp insert_content(repo, %{type: :document, document: source}, node_id) do
    insert(
      repo,
      ResourceDocument.changeset(%{
        id: Ecto.UUID.generate(),
        node_id: node_id,
        author_id: source.author_id,
        name: source.name,
        content: source.content
      }),
      :resource_document
    )
  end

  defp insert_content(repo, %{type: :file, file: source}, node_id) do
    insert(
      repo,
      ResourceFile.changeset(%{
        id: Ecto.UUID.generate(),
        node_id: node_id,
        author_id: source.author_id,
        blob_id: source.blob_id,
        preview_blob_id: source.preview_blob_id,
        name: source.name,
        description: source.description
      }),
      :resource_file
    )
  end

  defp insert_content(repo, %{type: :link, link: source}, node_id) do
    insert(
      repo,
      ResourceLink.changeset(%{
        id: Ecto.UUID.generate(),
        node_id: node_id,
        author_id: source.author_id,
        name: source.name,
        url: source.url,
        description: source.description,
        type: source.type
      }),
      :resource_link
    )
  end

  defp insert(repo, changeset, type) do
    case repo.insert(changeset) do
      {:ok, resource} -> {:ok, resource}
      {:error, changeset} -> {:error, {:invalid_child, type, changeset}}
    end
  end
end
