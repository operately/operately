defmodule Operately.Operations.ResourceHubFolderCopying.Queries do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.ResourceHubs.Node

  def query_folder_children(folder_id) do
    from(n in Node, where: n.parent_folder_id == ^folder_id)
    |> with_folders()
    |> with_files()
    |> with_documents()
    |> with_links()
    |> Repo.all()
  end

  defp with_folders(query) do
    from(n in query,
      left_join: folder in assoc(n, :folder),
      left_join: n_folder in assoc(folder, :node),
      preload: [folder: {folder, node: n_folder}]
    )
  end

  defp with_files(query) do
    from(n in query,
      left_join: file in assoc(n, :file),
      left_join: n_file in assoc(file, :node),
      left_join: subs_list_file in assoc(file, :subscription_list),
      left_join: subs_file in assoc(subs_list_file, :subscriptions),
      preload: [file: {file, node: n_file, subscription_list: {subs_list_file, subscriptions: subs_file}}]
    )
  end

  defp with_documents(query) do
    from(n in query,
      left_join: document in assoc(n, :document),
      left_join: n_document in assoc(document, :node),
      left_join: subs_list_document in assoc(document, :subscription_list),
      left_join: subs_document in assoc(subs_list_document, :subscriptions),
      preload: [document: {document, node: n_document, subscription_list: {subs_list_document, subscriptions: subs_document}}]
    )
  end

  defp with_links(query) do
    from(n in query,
      left_join: link in assoc(n, :link),
      left_join: n_link in assoc(link, :node),
      left_join: subs_list_link in assoc(link, :subscription_list),
      left_join: subs_link in assoc(subs_list_link, :subscriptions),
      preload: [link: {link, node: n_link, subscription_list: {subs_list_link, subscriptions: subs_link}}]
    )
  end
end
