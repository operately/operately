defmodule Operately.Data.Change047PopulatePublishedAtFieldInExistingPublishedDocumentsTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.ResourceHubs.Document

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> create_documents()
  end

  test "populates published_at field in existing published documents", ctx do
    Enum.each(ctx.docs, fn doc ->
      assert doc.state == :published
      refute doc.published_at
    end)

    :timer.sleep(400)

    Operately.Data.Change047PopulatePublishedAtFieldInExistingPublishedDocuments.run()

    Enum.each(ctx.docs, fn doc ->
      doc = Repo.reload(doc)

      assert doc.state == :published
      assert doc.published_at
    end)
  end

  test "doesn't populate published_at field in existing draft documents", ctx do
    Operately.Data.Change047PopulatePublishedAtFieldInExistingPublishedDocuments.run()

    draft_doc = Repo.reload(ctx.draft_doc)
    refute draft_doc.published_at
  end

  defp create_documents(ctx) do
    ctx =
      ctx
      |> Factory.add_document(:doc1, :hub)
      |> Factory.add_document(:doc2, :hub)
      |> Factory.add_document(:doc3, :hub)
      |> Factory.add_document(:draft_doc, :hub, state: :draft)

    docs = Enum.map([ctx.doc1, ctx.doc2, ctx.doc3], fn doc ->
      {:ok, document} = Document.changeset(doc, %{published_at: nil})
      |> Repo.update()
      document
    end)

    Map.put(ctx, :docs, docs)
  end
end
