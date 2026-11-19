defmodule Operately.Operations.ResourceHubDocumentPublishingTest do
  use Operately.DataCase

  alias Operately.Operations.ResourceHubDocumentPublishing
  alias Operately.ResourceHubs.DocumentVersion
  alias Operately.Support.RichText

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub, state: :draft)

    Map.update!(ctx, :document, &Repo.preload(&1, [:resource_hub, :node]))
  end

  test "publishing preserves a migration version and captures the next version", ctx do
    baseline =
      DocumentVersion.changeset(%{
        document_id: ctx.document.id,
        version_number: 1,
        title: ctx.document.name,
        content: ctx.document.content,
        origin: :migration
      })
      |> Repo.insert!()

    content = RichText.rich_text("Final draft")

    assert {:ok, published} =
             ResourceHubDocumentPublishing.run(ctx.creator, ctx.document, %{name: "Ready", content: content})

    assert published.state == :published
    assert published.current_version == 2
    assert Repo.reload!(published).current_version == 2

    [version, previous] = DocumentVersion.list_for_document(published.id)
    assert version.version_number == 2
    assert version.origin == :created
    assert version.editor_id == ctx.creator.id
    assert version.title == "Ready"
    assert version.content == content
    assert previous.id == baseline.id
    assert previous.origin == :migration
    assert previous.title == baseline.title
    assert previous.content == baseline.content
  end

  test "a stale draft cannot be published twice", ctx do
    assert {:ok, published} = ResourceHubDocumentPublishing.run(ctx.creator, ctx.document, %{})

    assert {:error, :forbidden} =
             ResourceHubDocumentPublishing.run(ctx.creator, ctx.document, %{name: "Stale publish"})

    reloaded = Repo.reload!(published)
    assert reloaded.name == published.name
    assert reloaded.current_version == 1
    assert length(DocumentVersion.list_for_document(published.id)) == 1

    assert Repo.aggregate(
             from(a in Operately.Activities.Activity,
               where: a.action == "resource_hub_document_created" and a.content["document_id"] == ^published.id
             ),
             :count
           ) == 1
  end

  test "transaction failures return an error tuple and leave the draft unchanged", ctx do
    assert {:error, %Ecto.Changeset{} = changeset} =
             ResourceHubDocumentPublishing.run(ctx.creator, ctx.document, %{name: ""})

    assert Keyword.has_key?(changeset.errors, :name)
    assert Repo.reload!(ctx.document).state == :draft
    assert DocumentVersion.list_for_document(ctx.document.id) == []
  end
end
