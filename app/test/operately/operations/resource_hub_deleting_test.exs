defmodule Operately.Operations.ResourceHubDeletingTest do
  use Operately.DataCase
  alias Operately.ResourceHubs.{Node, ResourceHub}
  alias Operately.Operations.ResourceHubDeleting

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.fetch_default_resource_hub(:default_hub, :space) |> Factory.add_resource_hub(:hub, :space, :creator)
  end

  test "rejects deleting the default without changing hubs or recording activities", ctx do
    assert {:error, :default_hub} = ResourceHubDeleting.run(ctx.creator, ctx.default_hub)
    assert Repo.get(ResourceHub, ctx.default_hub.id)
    assert Repo.reload!(ctx.space).default_resource_hub_id == ctx.default_hub.id
    refute Repo.get_by(Operately.Activities.Activity, action: "resource_hub_deleted")
  end

  test "rejects deleting the last hub", ctx do
    Repo.delete!(ctx.hub)
    assert {:error, :default_hub} = ResourceHubDeleting.run(ctx.creator, ctx.default_hub)
    assert Repo.get(ResourceHub, ctx.default_hub.id)
    assert Repo.reload!(ctx.space).default_resource_hub_id == ctx.default_hub.id
  end

  test "deletes a non-default hub and records its activity", ctx do
    assert {:ok, _} = ResourceHubDeleting.run(ctx.creator, ctx.hub)
    refute Repo.get(ResourceHub, ctx.hub.id)
    assert Repo.reload!(ctx.space).default_resource_hub_id == ctx.default_hub.id
    activity = Repo.get_by!(Operately.Activities.Activity, action: "resource_hub_deleted")
    assert activity.content["resource_hub_id"] == ctx.hub.id
  end

  test "all top-level node types block deletion regardless of publication state", ctx do
    for type <- [:document, :folder, :file, :link] do
      node = Node.changeset(%{resource_hub_id: ctx.hub.id, type: type}) |> Repo.insert!()
      assert {:error, :not_empty} = ResourceHubDeleting.run(ctx.creator, ctx.hub)
      assert Repo.get(ResourceHub, ctx.hub.id)
      Repo.soft_delete!(node)
    end

    assert {:ok, _} = ResourceHubDeleting.run(ctx.creator, ctx.hub)
  end

  test "a draft owned by another author blocks deletion", ctx do
    ctx = ctx |> Factory.add_company_member(:author) |> Factory.add_document(:draft, :hub, author: :author, state: :draft)
    assert {:error, :not_empty} = ResourceHubDeleting.run(ctx.creator, ctx.hub)
    assert Repo.reload!(ctx.draft)
  end

  test "deletion cleans up removed content and its comments and reactions", ctx do
    ctx = ctx |> Factory.add_document(:document, :hub)
    ctx = Map.update!(ctx, :document, &Repo.preload(&1, [:node, :resource_hub]))
    ctx = ctx |> Factory.add_comment(:comment, :document) |> Factory.add_reactions(:reaction, :comment)
    document = Repo.preload(ctx.document, [:node, :resource_hub])
    assert {:ok, _} = Operately.Operations.ResourceHubDocumentDeleting.run(ctx.creator, document)
    assert {:ok, _} = ResourceHubDeleting.run(ctx.creator, ctx.hub)
    refute Repo.get(Operately.ResourceHubs.Document, document.id, with_deleted: true)
    refute Repo.get(Operately.Updates.Comment, ctx.comment.id)
    refute Repo.get(Operately.Updates.Reaction, ctx.reaction.id)
  end

  test "deleting a hub cascades to all children of a soft-deleted folder", ctx do
    ctx =
      ctx
      |> Factory.add_folder(:folder, :hub)
      |> Factory.add_folder(:nested_folder, :hub, :folder)
      |> Factory.add_document(:document, :hub, folder: :nested_folder, content: Operately.Support.RichText.rich_text("Hello world"))
      |> Factory.add_file(:file, :hub, folder: :nested_folder)
      |> Factory.add_link(:link, :hub, folder: :nested_folder)
      |> Factory.add_inline_thread(:thread, :document, from: 1, to: 6, quote: "Hello")

    assert Repo.exists?(from v in Operately.ResourceHubs.DocumentVersion, where: v.document_id == ^ctx.document.id)
    assert {:error, :not_empty} = ResourceHubDeleting.run(ctx.creator, ctx.hub)
    folder = Repo.preload(ctx.folder, [:node, :resource_hub])
    assert {:ok, _} = Operately.Operations.ResourceHubFolderDeleting.run(ctx.creator, folder)
    assert {:ok, _} = ResourceHubDeleting.run(ctx.creator, ctx.hub)

    for child <- [ctx.folder, ctx.nested_folder, ctx.document, ctx.file, ctx.link] do
      refute Repo.get(child.__struct__, child.id, with_deleted: true)
    end

    refute Repo.exists?(from(n in Node, where: n.resource_hub_id == ^ctx.hub.id), with_deleted: true)
    refute Repo.exists?(from v in Operately.ResourceHubs.DocumentVersion, where: v.document_id == ^ctx.document.id)
    refute Repo.get(Operately.Comments.InlineThread, ctx.thread.id)
    refute Repo.exists?(from c in Operately.Updates.Comment, where: c.entity_id == ^ctx.thread.id)
  end

  test "concurrent content creation prevents deletion after the writer commits" do
    alias Ecto.Adapters.SQL.Sandbox

    Sandbox.unboxed_run(Repo, fn ->
      ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.fetch_default_resource_hub(:default_hub, :space) |> Factory.add_resource_hub(:hub, :space, :creator)
      parent = self()

      try do
        writer =
          Task.async(fn ->
            Sandbox.unboxed_run(Repo, fn ->
              Repo.transaction(fn ->
                node = Node.changeset(%{resource_hub_id: ctx.hub.id, type: :folder}) |> Repo.insert!()
                send(parent, :inserted)

                receive do
                  :commit -> node
                after
                  5_000 -> Repo.rollback(:test_timeout)
                end
              end)
            end)
          end)

        assert_receive :inserted, 2_000
        deleter = Task.async(fn -> Sandbox.unboxed_run(Repo, fn -> ResourceHubDeleting.run(ctx.creator, ctx.hub) end) end)
        assert Task.yield(deleter, 100) == nil
        send(writer.pid, :commit)
        assert {:ok, node} = Task.await(writer)
        assert {:error, :not_empty} = Task.await(deleter)
        assert Repo.get(Node, node.id)
        assert Repo.get(ResourceHub, ctx.hub.id)
      after
        Repo.delete!(ctx.company)
        Repo.delete!(ctx.account)
      end
    end)
  end
end
