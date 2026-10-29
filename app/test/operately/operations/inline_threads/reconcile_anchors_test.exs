defmodule Operately.Operations.InlineThreads.ReconcileAnchorsTest do
  use Operately.DataCase

  alias Operately.Operations.{ResourceHubDocumentEditing, ResourceHubDocumentVersionRestoring}
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, content: RichText.rich_text("Hello world"))
    |> Factory.add_inline_thread(:thread, :document, from: 1, to: 6, quote: "Hello")
  end

  test "saves move overlapping and resolved threads without changing messages or resolution", ctx do
    ctx = Factory.add_inline_thread(ctx, :overlap, :document, from: 4, to: 9, quote: "lo wo")
    {:ok, resolved} = Operately.Operations.InlineThreadResolving.run(ctx.creator, ctx.thread)
    before_messages = Repo.all(Operately.Updates.Comment)
    save(ctx, "Say Hello world")

    assert %{current_from: 5, current_to: 10, current_version: 2, status: :attached} = Repo.reload!(ctx.thread).anchor
    assert %{current_from: 8, current_to: 13} = Repo.reload!(ctx.overlap).anchor
    assert Repo.reload!(resolved).resolved_at == resolved.resolved_at
    assert Repo.all(Operately.Updates.Comment) == before_messages
  end

  test "title-only changes advance versions; identical saves do nothing", ctx do
    document = Repo.preload(ctx.document, [:resource_hub, :node])
    attrs = %{name: "Renamed", content: document.content}
    assert {:ok, updated} = ResourceHubDocumentEditing.run(ctx.creator, document, attrs)
    thread = Repo.reload!(ctx.thread)
    assert %{current_version: 2, current_from: 1, current_to: 6} = thread.anchor
    assert {:ok, same} = ResourceHubDocumentEditing.run(ctx.creator, updated, attrs)
    assert same.current_version == 2
    assert Repo.reload!(thread) == thread
  end

  test "deleted passages remain detached when a document version is restored", ctx do
    save(ctx, "Hello world extended")
    save(ctx, "Gone")
    assert Repo.reload!(ctx.thread).anchor.status == :unattached
    restore(ctx, 2)
    assert Repo.reload!(ctx.thread).anchor.status == :unattached
    restore(ctx, 1)
    assert %{status: :unattached, current_from: nil, current_to: nil, current_version: 5} = Repo.reload!(ctx.thread).anchor
  end

  test "anchors with a stale version detach safely", ctx do
    save(ctx, "Say Hello world")
    Repo.update!(Ecto.Changeset.change(Repo.reload!(ctx.thread)) |> Ecto.Changeset.put_embed(:anchor, Map.from_struct(ctx.thread.anchor)))
    save(ctx, "Please say Hello world")
    assert %{status: :unattached, current_from: nil, current_to: nil, current_version: 3} = Repo.reload!(ctx.thread).anchor
  end

  test "version insert failure rolls back document and anchor updates", ctx do
    alias Operately.ResourceHubs.DocumentVersion
    Repo.insert!(DocumentVersion.changeset(%{document_id: ctx.document.id, version_number: 2, title: "Conflict", content: ctx.document.content, origin: :edited}))
    document = Repo.preload(ctx.document, [:resource_hub, :node])
    assert {:error, %Ecto.Changeset{}} = ResourceHubDocumentEditing.run(ctx.creator, document, %{name: document.name, content: RichText.rich_text("Say Hello world")})
    assert Repo.reload!(ctx.document).current_version == 1
    assert Repo.reload!(ctx.document).content == ctx.document.content
    assert Repo.reload!(ctx.thread).anchor == ctx.thread.anchor
    assert DocumentVersion.get_by_document_and_number(document.id, 2).title == "Conflict"
  end

  test "deleted passages remain detached when the original content is saved again", ctx do
    save(ctx, "Gone")
    save(ctx, "Hello world")
    assert %{status: :unattached, current_from: nil, current_to: nil, current_version: 3} = Repo.reload!(ctx.thread).anchor
  end

  defp save(ctx, text) do
    document = Repo.reload!(ctx.document) |> Repo.preload([:resource_hub, :node])
    assert {:ok, document} = ResourceHubDocumentEditing.run(ctx.creator, document, %{name: document.name, content: RichText.rich_text(text)})
    document
  end

  defp restore(ctx, version) do
    document = Repo.reload!(ctx.document) |> Repo.preload([:resource_hub, :node])
    assert {:ok, _} = ResourceHubDocumentVersionRestoring.run(ctx.creator, document, %{version_number: version, expected_current_version: document.current_version})
  end
end
