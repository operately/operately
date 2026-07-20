defmodule Operately.Data.Change047PopulatePublishedAtFieldInExistingPublishedDocuments do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.Document

  def run do
    Repo.transaction(fn ->
      fetch_documents()
      |> update_documents()
    end)
  end

  defp fetch_documents do
    from(d in Document, where: d.state == "published" and is_nil(d.published_at))
    |> Repo.all()
  end

  defp update_documents(docs) when is_list(docs) do
    Enum.each(docs, &update_documents/1)
  end

  defp update_documents(doc) do
    {:ok, _} =
      doc
      |> Ecto.Changeset.change(%{published_at: doc.inserted_at})
      |> Repo.update()
  end

  defmodule Document do
    use Operately.Schema

    schema "resource_documents" do
      field :state, :string
      field :published_at, :utc_datetime
      field :inserted_at, :utc_datetime

      soft_delete()
    end
  end
end
