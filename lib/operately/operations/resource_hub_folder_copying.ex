defmodule Operately.Operations.ResourceHubFolderCopying do
  alias Operately.{Repo, ResourceHubs}
  alias Operately.ResourceHubs.{Node, Document, File, Link, Folder}

  alias Operately.Operations.ResourceHubFolderCopying.{
    Queries,
    SubscriptionsList,
    Subscription,
  }

  def run(resource_hub, folder) do
    Repo.transaction(fn ->
      folder
      |> copy_folder_and_children()
      |> copy_nodes(resource_hub)
      |> SubscriptionsList.copy()
      |> Subscription.copy()
      |> separate_nodes()
      |> Enum.map(fn children_group ->
        copy_node_children(children_group)
      end)
    end)
  end

  defp copy_folder_and_children(folder, parent_folder_id \\ nil) do
    new_folder = copy_folder(folder, parent_folder_id)

    children =
      folder.id
      |> Queries.query_folder_children()
      |> Enum.reduce(%{folders: [], others: []}, fn node, acc ->
        cond do
          node.folder -> Map.update!(acc, :folders, &([node | &1]))
          true -> Map.update!(acc, :others, &([node | &1]))
        end
      end)

    nested_children = Enum.map(children.folders, fn n -> copy_folder_and_children(n.folder, new_folder.id) end)
    curr_children = Enum.map(children.others, fn n -> Map.put(n, :parent_folder_id, new_folder.id) end)

    List.flatten(nested_children ++ curr_children)
  end

  defp copy_folder(folder, parent_folder_id) do
      node_attrs =
        folder.node
        |> Map.from_struct()
        |> then(fn attrs ->
          if parent_folder_id do
            Map.put(attrs, :parent_folder_id, parent_folder_id)
          else
            attrs
          end
        end)

      {:ok, new_node} = ResourceHubs.create_node(node_attrs)

      folder_attrs =
        Map.from_struct(folder)
        |> Map.put(:node_id, new_node.id)

      {:ok, new_folder} = ResourceHubs.create_folder(folder_attrs)
      new_folder
  end

  defp copy_nodes(nodes, resource_hub) do
    nodes = Enum.map(nodes, fn n -> Map.put(n, :new_id, Ecto.UUID.generate()) end)

    data = Enum.map(nodes, fn n ->
      now = current_timestamp()

      %{
        id: n.new_id,
        resource_hub_id: resource_hub.id,
        parent_folder_id: n.parent_folder_id,
        name: n.name,
        type: n.type,
        inserted_at: now,
        updated_at: now,
      }
    end)

    count = length(data)
    {^count, new_nodes} = Repo.insert_all(Node, data, returning: true)

    Enum.map(new_nodes, fn new_node ->
      original_node = Enum.find(nodes, &(&1.new_id == new_node.id))

      Map.merge(new_node, %{
        folder: original_node.folder,
        document: original_node.document,
        link: original_node.link,
        file: original_node.file,
      })
    end)
  end

  defp copy_node_children({:documents, documents}) do
    data = Enum.map(documents, fn n = %{document: d} ->
      now = current_timestamp()
      %{
        node_id: n.id,
        author_id: d.author_id,
        subscription_list_id: d.subscription_list_id,
        content: d.content,
        inserted_at: now,
        updated_at: now,
      }
    end)

    count = length(data)
    {^count, new_documents} = Repo.insert_all(Document, data, returning: true)

    new_documents
  end

  defp copy_node_children({:files, files}) do
    data = Enum.map(files, fn n = %{file: f} ->
      now = current_timestamp()
      %{
        node_id: n.id,
        author_id: f.author_id,
        subscription_list_id: f.subscription_list_id,
        blob_id: f.blob_id,
        preview_blob_id: f.preview_blob_id,
        description: f.description,
        inserted_at: now,
        updated_at: now,
      }
    end)

    count = length(data)
    {^count, new_files} = Repo.insert_all(File, data, returning: true)

    new_files
  end

  defp copy_node_children({:links, links}) do
    data = Enum.map(links, fn n = %{link: l} ->
      now = current_timestamp()
      %{
        node_id: n.id,
        author_id: l.author_id,
        subscription_list_id: l.subscription_list_id,
        url: l.url,
        description: l.description,
        type: l.type,
        inserted_at: now,
        updated_at: now,
      }
    end)

    count = length(data)
    {^count, new_links} = Repo.insert_all(Link, data, returning: true)

    new_links
  end

  defp copy_node_children({:folders, folders}) do
    data = Enum.map(folders, fn n ->
      now = current_timestamp()
      %{
        node_id: n.id,
        inserted_at: now,
        updated_at: now,
      }
    end)

    count = length(data)
    {^count, new_folders} = Repo.insert_all(Folder, data, returning: true)

    new_folders
  end

  defp separate_nodes(nodes) do
    nodes
    |> Enum.reduce(%{links: [], folders: [], files: [], documents: []}, fn node, acc ->
      cond do
        node.link -> Map.update!(acc, :links, &([node | &1]))
        node.folder -> Map.update!(acc, :folders, &([node | &1]))
        node.file -> Map.update!(acc, :files, &([node | &1]))
        node.document -> Map.update!(acc, :documents, &([node | &1]))
      end
    end)
    |> Enum.into([])
  end

  defp current_timestamp, do: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
end
