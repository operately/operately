defmodule Operately.Operations.InlineThreadMessageDeletingTest do
  use Operately.DataCase
  alias Operately.Comments.InlineThread
  alias Operately.Operations.{InlineThreadMessageDeleting, InlineThreadReplying}
  alias Operately.Support.RichText

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub, content: RichText.rich_text("Hello world"))
      |> Factory.add_inline_thread(:thread, :document, from: 1, to: 6, quote: "Hello")

    Map.put(ctx, :message, hd(ctx.thread.messages))
  end

  test "deleting the last message also deletes the thread", ctx do
    before = document_state(ctx)

    assert {:ok, nil} = InlineThreadMessageDeleting.run(ctx.creator, ctx.thread, ctx.message)
    assert Repo.reload(ctx.message) == nil
    assert Repo.get(InlineThread, ctx.thread.id) == nil
    assert document_state(ctx) == before
  end

  test "deleting the initial message keeps remaining replies", ctx do
    content = RichText.rich_text("Reply")
    {:ok, _} = InlineThreadReplying.run(ctx.creator, ctx.thread, content)

    assert {:ok, thread} = InlineThreadMessageDeleting.run(ctx.creator, ctx.thread, ctx.message)
    assert Repo.reload(ctx.message) == nil
    assert [reply] = thread.messages
    assert reply.content == content
  end

  defp document_state(ctx) do
    %{
      document: Repo.reload!(ctx.document),
      versions: Repo.aggregate(Operately.ResourceHubs.DocumentVersion, :count),
      activities: Repo.aggregate(Operately.Activities.Activity, :count),
      notifications: Repo.aggregate(Operately.Notifications.Notification, :count)
    }
  end
end
