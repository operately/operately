defmodule Operately.Data.Change047PopulatePublishedAtFieldInExistingPublishedDocuments do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.ResourceHubs.Document

  def run do
    Repo.transaction(fn ->
      fetch_documents()
      |> update_documents()
    end)
  end

  defp fetch_documents do
    from(d in Document, where: d.state == :published and is_nil(d.published_at))
    |> Repo.all()
  end

  defp update_documents(docs) when is_list(docs) do
    Enum.each(docs, &update_documents/1)
  end

  defp update_documents(doc) do
    {:ok, _} = Document.changeset(doc, %{published_at: doc.inserted_at})
    |> Repo.update()
  end
end
