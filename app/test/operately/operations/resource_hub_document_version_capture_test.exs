defmodule Operately.Operations.ResourceHubDocumentVersionCaptureTest do
  use Operately.DataCase

  alias Operately.ResourceHubs.DocumentVersion
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
  end

  test "published creation captures version 1", ctx do
    {:ok, document} = create_document(ctx, post_as_draft: false)

    [version] = DocumentVersion.list_for_document(document.id)

    assert version.version_number == 1
    assert version.origin == :created
    assert version.title == document.name
    assert version.editor_id == ctx.creator.id
    assert document.current_version == 1
  end

  test "draft creation does not capture a version", ctx do
    {:ok, document} = create_document(ctx, post_as_draft: true)

    assert DocumentVersion.list_for_document(document.id) == []
    assert document.state == :draft
    assert document.current_version == 1
  end

  test "draft edits do not create versions", ctx do
    {:ok, document} = create_document(ctx, post_as_draft: true)
    document = Repo.preload(document, [:resource_hub, :node])

    {:ok, updated} =
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: "Draft title",
        content: RichText.rich_text("Draft body")
      })

    assert updated.name == "Draft title"
    assert updated.current_version == 1
    assert DocumentVersion.list_for_document(document.id) == []

    refute Repo.exists?(
             from(a in Operately.Activities.Activity,
               where: a.action == "resource_hub_document_edited" and a.content["document_id"] == ^document.id
             )
           )
  end

  test "content edit increments once and snapshots new content", ctx do
    {:ok, document} = create_document(ctx)
    document = Repo.preload(document, [:resource_hub, :node])

    new_content = RichText.rich_text("Updated")

    {:ok, updated} =
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: document.name,
        content: new_content
      })

    versions = DocumentVersion.list_for_document(document.id)
    assert length(versions) == 2
    assert updated.current_version == 2
    assert hd(versions).origin == :edited
    assert hd(versions).content == new_content
  end

  test "title edit increments once", ctx do
    {:ok, document} = create_document(ctx)
    document = Repo.preload(document, [:resource_hub, :node])

    {:ok, updated} =
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: "New title",
        content: document.content
      })

    versions = DocumentVersion.list_for_document(document.id)
    assert length(versions) == 2
    assert updated.current_version == 2
    assert hd(versions).title == "New title"
    assert hd(versions).content == document.content
  end

  test "title-and-content edit creates one version", ctx do
    {:ok, document} = create_document(ctx)
    document = Repo.preload(document, [:resource_hub, :node])

    {:ok, updated} =
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: "New title",
        content: RichText.rich_text("Updated")
      })

    assert length(DocumentVersion.list_for_document(document.id)) == 2
    assert updated.current_version == 2
  end

  test "no-op edit creates no version or activity", ctx do
    {:ok, document} = create_document(ctx)
    document = Repo.preload(document, [:resource_hub, :node])

    {:ok, unchanged} =
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: document.name,
        content: document.content
      })

    assert unchanged.current_version == 1
    assert length(DocumentVersion.list_for_document(document.id)) == 1

    refute Repo.exists?(
             from(a in Operately.Activities.Activity,
               where: a.action == "resource_hub_document_edited" and a.content["document_id"] == ^document.id
             )
           )
  end

  test "subscription-only edit creates no version", ctx do
    {:ok, document} = create_document(ctx)
    document = Repo.preload(document, [:resource_hub, :node])

    {:ok, unchanged} =
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: document.name,
        content: document.content,
        send_to_everyone: false,
        subscriber_ids: []
      })

    assert unchanged.current_version == 1
    assert length(DocumentVersion.list_for_document(document.id)) == 1
  end

  test "publishing a draft captures version 1", ctx do
    {:ok, document} = create_document(ctx, post_as_draft: true)
    document = Repo.preload(document, [:resource_hub, :node])

    {:ok, _} =
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: "Ready",
        content: RichText.rich_text("Final draft")
      })

    document = Repo.reload!(document) |> Repo.preload([:resource_hub, :node], force: true)
    assert DocumentVersion.list_for_document(document.id) == []

    {:ok, published} =
      Operately.Operations.ResourceHubDocumentPublishing.run(ctx.creator, document, %{})

    [version] = DocumentVersion.list_for_document(document.id)
    assert published.state == :published
    assert published.current_version == 1
    assert version.version_number == 1
    assert version.origin == :created
    assert version.title == "Ready"
    assert version.content == RichText.rich_text("Final draft")
  end

  test "publish with edited body still captures a single first version", ctx do
    {:ok, document} = create_document(ctx, post_as_draft: true)
    document = Repo.preload(document, [:resource_hub, :node])
    new_content = RichText.rich_text("Published body")

    {:ok, published} =
      Operately.Operations.ResourceHubDocumentPublishing.run(ctx.creator, document, %{
        content: new_content
      })

    [version] = DocumentVersion.list_for_document(document.id)
    assert published.current_version == 1
    assert version.version_number == 1
    assert version.origin == :created
    assert version.content == new_content
  end

  test "stale expected_version returns conflict without writes", ctx do
    {:ok, document} = create_document(ctx)
    document = Repo.preload(document, [:resource_hub, :node])

    assert {:error, :version_conflict} =
             Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
               name: "Stale edit",
               content: document.content,
               expected_version: 99
             })

    reloaded = Repo.get!(Operately.ResourceHubs.Document, document.id)
    assert reloaded.name == document.name
    assert reloaded.current_version == 1
    assert length(DocumentVersion.list_for_document(document.id)) == 1
  end

  test "omitted expected_version keeps last-write-wins with sequential versions", ctx do
    {:ok, document} = create_document(ctx)
    document = Repo.preload(document, [:resource_hub, :node])

    {:ok, updated} =
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: "LWW edit",
        content: document.content
      })

    assert updated.current_version == 2
    assert length(DocumentVersion.list_for_document(document.id)) == 2
  end

  defp create_document(ctx, opts \\ []) do
    Operately.Operations.ResourceHubDocumentCreating.run(ctx.creator, ctx.hub, %{
      name: Keyword.get(opts, :name, "Document"),
      content: RichText.rich_text("Content"),
      post_as_draft: Keyword.get(opts, :post_as_draft, false),
      send_to_everyone: false,
      subscription_parent_type: :resource_hub_document,
      subscriber_ids: []
    })
  end
end
