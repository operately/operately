defmodule Operately.Operations.ResourceHubFolderCopying.Resources do
  alias Operately.Repo
  alias Operately.ResourceHubs.{Document, File, Link}

  @doc """
  Copies the associated resources (documents, files,
  and links) for the given nodes.

  Returns a list of newly created resource copies.
  """
  def copy(nodes) do
    nodes
    |> separate_nodes()
    |> Enum.flat_map(&copy_node_children/1)
  end

  defp copy_node_children({:documents, documents}) do
    data = Enum.map(documents, fn d ->
      common_data(d)
      |> Map.merge(%{
        content: d.content,
      })
    end)

    count = length(data)
    {^count, new_documents} = Repo.insert_all(Document, data, returning: true)

    update_subscription_list_reference(new_documents, documents)
  end

  defp copy_node_children({:files, files}) do
    data = Enum.map(files, fn f ->
      common_data(f)
      |> Map.merge(%{
        blob_id: f.blob_id,
        preview_blob_id: f.preview_blob_id,
        description: f.description,
      })
    end)

    count = length(data)
    {^count, new_files} = Repo.insert_all(File, data, returning: true)

    update_subscription_list_reference(new_files, files)
  end

  defp copy_node_children({:links, links}) do
    data = Enum.map(links, fn l ->
      common_data(l)
      |> Map.merge(%{
        url: l.url,
        description: l.description,
        type: l.type,
      })
    end)

    count = length(data)
    {^count, new_links} = Repo.insert_all(Link, data, returning: true)

    update_subscription_list_reference(new_links, links)
  end

  defp common_data(resource) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    %{
      author_id: resource.author_id,
      subscription_list_id: resource.subscription_list.id,
      node_id: resource.node_id,
      inserted_at: now,
      updated_at: now
    }
  end

  defp separate_nodes(nodes) do
    nodes
    |> Enum.reduce(%{links: [], files: [], documents: []}, fn node, acc ->
      cond do
        node.link -> Map.update!(acc, :links, &([Map.put(node.link, :node_id, node.id) | &1]))
        node.file -> Map.update!(acc, :files, &([Map.put(node.file, :node_id, node.id) | &1]))
        node.document -> Map.update!(acc, :documents, &([Map.put(node.document, :node_id, node.id) | &1]))
      end
    end)
    |> Enum.into([])
  end

  defp update_subscription_list_reference(new_resources, original_resources) do
    Enum.map(new_resources, fn resource ->
      list = find_subscription_list(original_resources, resource.subscription_list_id)
      Map.put(resource, :subscription_list, list)
    end)
  end

  defp find_subscription_list(resources, id) do
    Enum.find(resources, &(&1.subscription_list.id == id))
    |> then(&(&1.subscription_list))
  end
end
