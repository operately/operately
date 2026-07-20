defmodule Operately.Data.Change110BaselineDocumentVersionsTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Data.Change110BaselineDocumentVersions, as: Change
  alias Operately.ResourceHubs.DocumentVersion
  alias Operately.Support.Factory

  setup do
    ctx =
      Factory.setup(%{})
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)

    {:ok, ctx}
  end

  test "creates exactly one migration baseline per existing document", ctx do
    ctx =
      ctx
      |> Factory.add_document(:doc_a, :hub, name: "Alpha", content: %{"type" => "doc", "content" => []})
      |> Factory.add_document(:doc_b, :hub, name: "Beta", content: %{"type" => "doc", "content" => [%{"type" => "paragraph"}]})

    Change.run()

    versions =
      from(v in DocumentVersion, order_by: [asc: v.title])
      |> Repo.all()

    assert length(versions) == 2

    [alpha, beta] = versions

    assert alpha.title == "Alpha"
    assert alpha.content == ctx.doc_a.content
    assert alpha.content_schema_version == 1
    assert alpha.editor_id == nil
    assert alpha.origin == :migration
    assert alpha.version_number == 1
    assert NaiveDateTime.compare(
             alpha.inserted_at,
             NaiveDateTime.truncate(ctx.doc_a.updated_at, :second)
           ) == :eq

    assert beta.title == "Beta"
    assert beta.content == ctx.doc_b.content
    assert beta.origin == :migration

    doc_a = Repo.get!(Operately.ResourceHubs.Document, ctx.doc_a.id)
    doc_b = Repo.get!(Operately.ResourceHubs.Document, ctx.doc_b.id)
    assert doc_a.current_version == 1
    assert doc_b.current_version == 1
  end

  test "is idempotent and does not duplicate rows", ctx do
    ctx = Factory.add_document(ctx, :document, :hub)

    Change.run()
    Change.run()

    count =
      from(v in DocumentVersion, where: v.document_id == ^ctx.document.id)
      |> Repo.aggregate(:count, :id)

    assert count == 1
  end

  test "skips documents that already have versions", ctx do
    ctx = Factory.add_document(ctx, :document, :hub)

    assert {:ok, existing} =
             Operately.ResourceHubs.create_document_version(%{
               document_id: ctx.document.id,
               version_number: 1,
               title: "Already versioned",
               content: %{"type" => "doc", "content" => []},
               content_schema_version: 1,
               editor_id: ctx.creator.id,
               origin: :created
             })

    Change.run()

    versions =
      from(v in DocumentVersion, where: v.document_id == ^ctx.document.id)
      |> Repo.all()

    assert length(versions) == 1
    assert hd(versions).id == existing.id
    assert hd(versions).origin == :created
  end

  test "includes soft-deleted documents and does not join nodes", ctx do
    ctx = Factory.add_document(ctx, :document, :hub, name: "Soft deleted")

    {:ok, _} =
      ctx.document
      |> Ecto.Changeset.change(%{deleted_at: DateTime.utc_now()})
      |> Repo.update()

    Change.run()

    version =
      from(v in DocumentVersion, where: v.document_id == ^ctx.document.id)
      |> Repo.one!()

    assert version.title == "Soft deleted"
    assert version.origin == :migration
  end
end
