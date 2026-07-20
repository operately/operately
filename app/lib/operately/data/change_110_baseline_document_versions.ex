defmodule Operately.Data.Change110BaselineDocumentVersions do
  @moduledoc """
  Creates version 1 for every document that has no version rows yet.

  Idempotent: documents that already have at least one version are skipped.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo

  defmodule Document do
    use Operately.Schema

    schema "resource_documents" do
      field :name, :string
      field :content, :map
      field :current_version, :integer
      field :updated_at, :naive_datetime
    end
  end

  defmodule DocumentVersion do
    use Operately.Schema

    schema "resource_document_versions" do
      field :document_id, :binary_id
      field :version_number, :integer
      field :title, :string
      field :content, :map
      field :content_schema_version, :integer
      field :editor_id, :binary_id
      field :origin, :string
      field :restored_from_version_number, :integer
      field :inserted_at, :naive_datetime
    end

    def changeset(version, attrs) do
      version
      |> cast(attrs, [
        :id,
        :document_id,
        :version_number,
        :title,
        :content,
        :content_schema_version,
        :editor_id,
        :origin,
        :restored_from_version_number,
        :inserted_at
      ])
      |> validate_required([
        :id,
        :document_id,
        :version_number,
        :title,
        :content,
        :content_schema_version,
        :origin,
        :inserted_at
      ])
    end
  end

  def run do
    Repo.transaction(fn ->
      documents_without_versions()
      |> Enum.each(&insert_baseline_version/1)
    end)
  end

  defp documents_without_versions do
    from(d in Document,
      left_join: v in DocumentVersion,
      on: v.document_id == d.id,
      where: is_nil(v.id),
      select: d
    )
    |> Repo.all()
  end

  defp insert_baseline_version(document) do
    inserted_at =
      case document.updated_at do
        %NaiveDateTime{} = dt ->
          NaiveDateTime.truncate(dt, :second)

        nil ->
          NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
      end

    {:ok, _} =
      %DocumentVersion{}
      |> DocumentVersion.changeset(%{
        id: Ecto.UUID.generate(),
        document_id: document.id,
        version_number: 1,
        title: document.name,
        content: document.content,
        content_schema_version: 1,
        editor_id: nil,
        origin: "migration",
        inserted_at: inserted_at
      })
      |> Repo.insert()

    from(d in Document, where: d.id == ^document.id)
    |> Repo.update_all(set: [current_version: 1])
  end
end
