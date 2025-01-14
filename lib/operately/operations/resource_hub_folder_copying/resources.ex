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
    data = Enum.map(documents, fn n = %{document: d} ->
      common_data(n, d)
      |> Map.merge(%{
        content: d.content,
      })
    end)

    count = length(data)
    {^count, new_documents} = Repo.insert_all(Document, data, returning: true)

    new_documents
  end

  defp copy_node_children({:files, files}) do
    data = Enum.map(files, fn n = %{file: f} ->
      common_data(n, f)
      |> Map.merge(%{
        blob_id: f.blob_id,
        preview_blob_id: f.preview_blob_id,
        description: f.description,
      })
    end)

    count = length(data)
    {^count, new_files} = Repo.insert_all(File, data, returning: true)

    new_files
  end

  defp copy_node_children({:links, links}) do
    data = Enum.map(links, fn n = %{link: l} ->
      common_data(n, l)
      |> Map.merge(%{
        url: l.url,
        description: l.description,
        type: l.type,
      })
    end)

    count = length(data)
    {^count, new_links} = Repo.insert_all(Link, data, returning: true)

    new_links
  end

  defp common_data(node, resource) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    %{
      author_id: resource.author_id,
      subscription_list_id: resource.subscription_list.id,
      node_id: node.id,
      inserted_at: now,
      updated_at: now
    }
  end

  defp separate_nodes(nodes) do
    nodes
    |> Enum.reduce(%{links: [], files: [], documents: []}, fn node, acc ->
      cond do
        node.link -> Map.update!(acc, :links, &([node | &1]))
        node.file -> Map.update!(acc, :files, &([node | &1]))
        node.document -> Map.update!(acc, :documents, &([node | &1]))
      end
    end)
    |> Enum.into([])
  end
end
