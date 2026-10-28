defmodule Operately.Operations.InlineThreadMessageEditingTest do
  use Operately.DataCase
  alias Operately.Operations.InlineThreadMessageEditing
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

  test "updates only the message content", ctx do
    before = document_state(ctx)
    content = RichText.rich_text("Edited")

    assert {:ok, thread} = InlineThreadMessageEditing.run(ctx.creator, ctx.thread, ctx.message, content)
    assert thread.id == ctx.thread.id
    assert [message] = thread.messages
    assert message.content == content
    assert Repo.reload!(ctx.message).content == content
    assert document_state(ctx) == before
  end

  test "invalid edits preserve the message", ctx do
    assert {:error, :invalid_content} = InlineThreadMessageEditing.run(ctx.creator, ctx.thread, ctx.message, %{})
    assert Repo.reload!(ctx.message).content == ctx.message.content
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
