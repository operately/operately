defmodule Operately.Data.Change110BaselineDocumentVersionsTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Data.Change110BaselineDocumentVersions, as: Change
  alias Operately.Data.Change110BaselineDocumentVersions.Document, as: ChangeDocument
  alias Operately.Data.Change110BaselineDocumentVersions.DocumentVersion

  # Minimal seed schema for this migration test only. Keeps fixtures independent of
  # live ResourceHubs.Document / document-creating operations.
  defmodule SeedDocument do
    use Operately.Schema

    schema "resource_documents" do
      field :name, :string
      field :content, :map
      field :current_version, :integer
      field :deleted_at, :utc_datetime

      timestamps()
    end
  end

  setup do
    ensure_historical_version_columns!()
    :ok
  end

  test "creates exactly one migration baseline per existing document" do
    doc_a = insert_document!("Alpha", %{"type" => "doc", "content" => []})
    doc_b = insert_document!("Beta", %{"type" => "doc", "content" => [%{"type" => "paragraph"}]})

    Change.run()

    versions =
      from(v in DocumentVersion, order_by: [asc: v.title])
      |> Repo.all()

    assert length(versions) == 2

    [alpha, beta] = versions

    assert alpha.title == "Alpha"
    assert alpha.content == doc_a.content
    assert alpha.content_schema_version == 1
    assert alpha.editor_id == nil
    assert alpha.origin == "migration"
    assert alpha.version_number == 1

    assert NaiveDateTime.compare(
             alpha.inserted_at,
             NaiveDateTime.truncate(doc_a.updated_at, :second)
           ) == :eq

    assert beta.title == "Beta"
    assert beta.content == doc_b.content
    assert beta.origin == "migration"

    assert Repo.get!(ChangeDocument, doc_a.id).current_version == 1
    assert Repo.get!(ChangeDocument, doc_b.id).current_version == 1
  end

  test "is idempotent and does not duplicate rows" do
    document = insert_document!("Doc", %{"type" => "doc", "content" => []})

    Change.run()
    Change.run()

    count =
      from(v in DocumentVersion, where: v.document_id == ^document.id)
      |> Repo.aggregate(:count, :id)

    assert count == 1
  end

  test "skips documents that already have versions" do
    document = insert_document!("Already versioned", %{"type" => "doc", "content" => []})

    existing =
      insert_version!(%{
        document_id: document.id,
        version_number: 1,
        title: "Already versioned",
        content: %{"type" => "doc", "content" => []},
        origin: "created"
      })

    Change.run()

    versions =
      from(v in DocumentVersion, where: v.document_id == ^document.id)
      |> Repo.all()

    assert length(versions) == 1
    assert hd(versions).id == existing.id
    assert hd(versions).origin == "created"
  end

  test "includes soft-deleted documents and does not join nodes" do
    document = insert_document!("Soft deleted", %{"type" => "doc", "content" => []})

    {:ok, _} =
      document
      |> Ecto.Changeset.change(%{deleted_at: DateTime.utc_now() |> DateTime.truncate(:second)})
      |> Repo.update()

    Change.run()

    version =
      from(v in DocumentVersion, where: v.document_id == ^document.id)
      |> Repo.one!()

    assert version.title == "Soft deleted"
    assert version.origin == "migration"
  end

  #
  # Helpers
  #

  # Change110 still inserts content_schema_version (as it did when the baseline
  # migration ran). Later schema migrations drop that column; restore it here so
  # this test exercises Change110 against its historical table shape.
  defp ensure_historical_version_columns! do
    Repo.query!("""
    ALTER TABLE resource_document_versions
    ADD COLUMN IF NOT EXISTS content_schema_version integer
    """)
  end

  defp insert_document!(name, content) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    {:ok, document} =
      %SeedDocument{}
      |> Ecto.Changeset.change(%{
        name: name,
        content: content,
        current_version: 1,
        inserted_at: now,
        updated_at: now
      })
      |> Repo.insert()

    document
  end

  defp insert_version!(attrs) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    {:ok, version} =
      %DocumentVersion{}
      |> DocumentVersion.changeset(%{
        id: Ecto.UUID.generate(),
        document_id: attrs.document_id,
        version_number: attrs.version_number,
        title: attrs.title,
        content: attrs.content,
        content_schema_version: 1,
        editor_id: attrs[:editor_id],
        origin: attrs.origin,
        inserted_at: now
      })
      |> Repo.insert()

    version
  end
end
