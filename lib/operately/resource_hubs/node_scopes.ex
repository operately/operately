defmodule Operately.ResourceHubs.NodeScopes do
  import Ecto.Query, only: [from: 2]

  def preload_content(query, drafts_author \\ nil) do
    query = query
      |> with_folders()
      |> with_links()
      |> with_files()
      |> with_documents(drafts_author)

    from([folder: folder, document: document, link: link, file: file] in query,
      where: not is_nil(folder.id) or not is_nil(document.id) or not is_nil(link.id) or not is_nil(file.id)
    )
  end

  defp with_folders(q) do
    from(n in q,
      left_join: folder in assoc(n, :folder), as: :folder,
      left_join: node_folder in assoc(folder, :node),
      preload: [folder: {folder, node: node_folder}]
    )
  end

  defp with_links(q) do
    from(n in q,
      left_join: link in assoc(n, :link), as: :link,
      left_join: node_link in assoc(link, :node),
      left_join: author_link in assoc(link, :author),
      preload: [link: {link, node: node_link, author: author_link}]
    )
  end

  defp with_files(q) do
    from(n in q,
      left_join: file in assoc(n, :file), as: :file,
      left_join: node_file in assoc(file, :node),
      left_join: author_file in assoc(file, :author),
      left_join: blob_file in assoc(file, :blob),
      left_join: preview_blob_file in assoc(file, :preview_blob),
      preload: [file: {file, node: node_file, author: author_file, blob: blob_file, preview_blob: preview_blob_file}]
    )
  end

  defp with_documents(q, author) do
    q = join_document(q, author: author)

    from([document: document] in q,
      left_join: node_document in assoc(document, :node),
      left_join: author_document in assoc(document, :author),
      preload: [document: {document, node: node_document, author: author_document}]
    )
  end

  defp join_document(q, author: nil) do
    from(n in q,
      left_join: document in Operately.ResourceHubs.Document,
      on: document.node_id == n.id and document.state == :published,
      as: :document
    )
  end

  defp join_document(q, author: author) do
    from(n in q,
      left_join: document in Operately.ResourceHubs.Document,
      on: document.node_id == n.id and ((document.author_id == ^author.id and document.state == :draft) or document.state == :published),
      as: :document
    )
  end
end
