defmodule Operately.Operations.InlineThreadReplyingTest do
  use Operately.DataCase
  alias Operately.Operations.{InlineThreadReplying, InlineThreadResolving}
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, content: RichText.rich_text("Hello world"))
    |> Factory.add_inline_thread(:thread, :document, from: 1, to: 6, quote: "Hello")
  end

  test "replies preserve resolution without changing the document or sending events", ctx do
    {:ok, resolved} = InlineThreadResolving.run(ctx.creator, ctx.thread)
    before = document_state(ctx)

    assert {:ok, thread} = InlineThreadReplying.run(ctx.creator, resolved, RichText.rich_text("Reply"))
    assert thread.resolved_at == resolved.resolved_at
    assert length(thread.messages) == 2
    assert Enum.any?(thread.messages, &(&1.content == RichText.rich_text("Reply")))
    assert document_state(ctx) == before
  end

  test "reply returns an unattached anchor after the document version changes", ctx do
    ctx.document |> Ecto.Changeset.change(current_version: ctx.document.current_version + 1) |> Repo.update!()

    assert {:ok, thread} = InlineThreadReplying.run(ctx.creator, ctx.thread, RichText.rich_text("Reply"))
    assert thread.anchor.status == :unattached
    assert thread.anchor.current_from == nil
    assert thread.anchor.current_to == nil
    assert thread.anchor.quote == "Hello"
  end

  test "invalid replies do not add messages", ctx do
    assert {:error, :invalid_content} = InlineThreadReplying.run(ctx.creator, ctx.thread, %{})
    assert length(Repo.preload(ctx.thread, :messages, force: true).messages) == 1
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
