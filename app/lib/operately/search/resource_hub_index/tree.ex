defmodule Operately.Search.ResourceHubIndex.Tree do
  @moduledoc """
  Loads every searchable resource in a folder subtree with one recursive query.

  The query includes soft-deleted rows because folder deletion uses the resulting
  manifest to remove search entries for the complete hidden subtree.
  """

  import Ecto.Query

  alias Operately.Repo
  alias Operately.ResourceHubs.{Document, File, Folder, Link}

  @resource_types %{
    "folder" => {"resource_hub_folder", :folder_id},
    "document" => {"resource_hub_document", :document_id},
    "file" => {"resource_hub_file", :file_id},
    "link" => {"resource_hub_link", :link_id}
  }

  @empty_manifest Map.new(@resource_types, fn {_node_type, {source_type, _id_field}} -> {source_type, []} end)

  def manifest(root_folder_id) do
    root_folder_id
    |> subtree_resources_query()
    |> Repo.all()
    |> Enum.reduce(@empty_manifest, &add_to_manifest/2)
  end

  def keys(manifest) do
    Enum.flat_map(manifest, fn {source_type, ids} -> Enum.map(ids, &{source_type, &1}) end)
  end

  defp subtree_resources_query(root_folder_id) do
    subtree = build_subtree(root_folder_id)

    from(subtree in "subtree",
      left_join: folder in Folder,
      on: folder.node_id == subtree.node_id and subtree.node_type == "folder",
      left_join: document in Document,
      on: document.node_id == subtree.node_id and subtree.node_type == "document",
      left_join: file in File,
      on: file.node_id == subtree.node_id and subtree.node_type == "file",
      left_join: link in Link,
      on: link.node_id == subtree.node_id and subtree.node_type == "link",
      where: not is_nil(folder.id) or not is_nil(document.id) or not is_nil(file.id) or not is_nil(link.id),
      distinct: true,
      select: %{
        node_type: type(subtree.node_type, :string),
        folder_id: folder.id,
        document_id: document.id,
        file_id: file.id,
        link_id: link.id
      }
    )
    |> recursive_ctes(true)
    |> with_cte("subtree", as: ^subtree)
  end

  defp build_subtree(root_folder_id) do
    initial_query =
      from(root_folder in "resource_folders",
        join: root_node in "resource_nodes",
        on: root_node.id == root_folder.node_id,
        where: root_folder.id == type(^root_folder_id, :binary_id),
        select: %{
          node_id: root_node.id,
          node_type: root_node.type,
          folder_id: root_folder.id
        }
      )

    recursive_query =
      from(parent in "subtree",
        join: child_node in "resource_nodes",
        on: child_node.parent_folder_id == parent.folder_id,
        left_join: child_folder in "resource_folders",
        on: child_folder.node_id == child_node.id and child_node.type == "folder",
        select: %{
          node_id: child_node.id,
          node_type: child_node.type,
          folder_id: child_folder.id
        }
      )

    union(initial_query, ^recursive_query)
  end

  defp add_to_manifest(%{node_type: node_type} = resource, manifest) do
    {source_type, id_field} = Map.fetch!(@resource_types, node_type)
    Map.update!(manifest, source_type, &[Map.fetch!(resource, id_field) | &1])
  end
end
