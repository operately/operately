defmodule Operately.ProjectTemplates.Resources.Materialization do
  alias Operately.Notifications.SubscriptionList
  alias Operately.ProjectTemplates.Resources.Tree
  alias Operately.ResourceHubs.{Document, DocumentVersion, File, Folder, Link, Node}

  def run(repo, template, project, creator_id) do
    source_nodes = template.resource_nodes || []
    base_time = DateTime.utc_now() |> DateTime.truncate(:second)

    source_nodes
    |> Tree.sort_by_depth()
    |> Enum.reduce_while({:ok, [], %{}, empty_parent_ids()}, fn source, {:ok, copied, folder_ids, parent_ids} ->
      attrs = %{
        resource_hub_id: project.resource_hub.id,
        parent_folder_id: Tree.remapped_parent_id!(source, folder_ids),
        type: source.type,
        inserted_at: ordered_time(base_time, source.position),
        updated_at: ordered_time(base_time, source.position)
      }

      with {:ok, node} <- insert_node(repo, attrs),
           {:ok, content} <- insert_content(repo, source, node, template.company_id, creator_id) do
        folder_ids = Tree.remember_folder_id(folder_ids, source, content)
        {:cont, {:ok, [node | copied], folder_ids, remember_parent_id(parent_ids, source, content)}}
      else
        {:error, reason} -> {:halt, {:error, reason}}
      end
    end)
    |> then(fn
      {:ok, nodes, _folder_ids, parent_ids} -> {:ok, %{nodes: Enum.reverse(nodes), parent_ids: parent_ids}}
      error -> error
    end)
  end

  # Maps copied documents, files, and links so their comments can be copied onto the new rows.
  # Folders are ignored because comments are not copied onto folders.
  defp empty_parent_ids, do: %{document: %{}, file: %{}, link: %{}}

  defp remember_parent_id(parent_ids, %{type: :document, document: document}, copied), do: put_in(parent_ids, [:document, document.id], copied.id)
  defp remember_parent_id(parent_ids, %{type: :file, file: file}, copied), do: put_in(parent_ids, [:file, file.id], copied.id)
  defp remember_parent_id(parent_ids, %{type: :link, link: link}, copied), do: put_in(parent_ids, [:link, link.id], copied.id)
  defp remember_parent_id(parent_ids, _source, _copied), do: parent_ids

  defp insert_node(repo, attrs) do
    case repo.insert(Node.changeset(attrs)) do
      {:ok, node} -> {:ok, node}
      {:error, changeset} -> {:error, {:invalid_resource_tree, changeset}}
    end
  end

  defp insert_content(repo, %{type: :folder, folder: folder}, node, _company_id, _creator_id),
    do: repo.insert(Folder.changeset(%{node_id: node.id, name: folder.name}))

  defp insert_content(repo, %{type: :document, document: document}, node, company_id, creator_id) do
    author_id = active_author_id(document.author, company_id, creator_id)

    with {:ok, list} <- insert_subscription_list(repo, :resource_hub_document),
         {:ok, copied} <-
           repo.insert(
             Document.changeset(%{
               node_id: node.id,
               author_id: author_id,
               subscription_list_id: list.id,
               name: document.name,
               content: document.content,
               state: :published,
               current_version: 1
             })
           ),
         {:ok, _} <- connect_subscription_list(repo, list, copied.id),
         {:ok, _} <-
           repo.insert(
             DocumentVersion.changeset(%{
               document_id: copied.id,
               editor_id: author_id,
               version_number: 1,
               title: copied.name,
               content: copied.content,
               origin: :created
             })
           ) do
      {:ok, copied}
    end
  end

  defp insert_content(repo, %{type: :file, file: file}, node, company_id, creator_id) do
    author_id = active_author_id(file.author, company_id, creator_id)

    with {:ok, list} <- insert_subscription_list(repo, :resource_hub_file),
         {:ok, copied} <-
           repo.insert(
             File.changeset(%{
               node_id: node.id,
               author_id: author_id,
               subscription_list_id: list.id,
               blob_id: file.blob_id,
               preview_blob_id: file.preview_blob_id,
               name: file.name,
               description: file.description
             })
           ),
         {:ok, _} <- connect_subscription_list(repo, list, copied.id) do
      {:ok, copied}
    end
  end

  defp insert_content(repo, %{type: :link, link: link}, node, company_id, creator_id) do
    author_id = active_author_id(link.author, company_id, creator_id)

    with {:ok, list} <- insert_subscription_list(repo, :resource_hub_link),
         {:ok, copied} <-
           repo.insert(
             Link.changeset(%{
               node_id: node.id,
               author_id: author_id,
               subscription_list_id: list.id,
               name: link.name,
               url: link.url,
               description: link.description,
               type: link.type
             })
           ),
         {:ok, _} <- connect_subscription_list(repo, list, copied.id) do
      {:ok, copied}
    end
  end

  defp insert_subscription_list(repo, parent_type), do: repo.insert(SubscriptionList.changeset(%{parent_type: parent_type}))
  defp connect_subscription_list(repo, list, parent_id), do: repo.update(SubscriptionList.changeset(list, %{parent_id: parent_id}))

  defp active_author_id(nil, _company_id, creator_id), do: creator_id

  defp active_author_id(author, company_id, creator_id) do
    if author.company_id == company_id and author.suspended != true and is_nil(author.suspended_at), do: author.id, else: creator_id
  end

  defp ordered_time(base_time, position), do: DateTime.add(base_time, -position, :second)
end
