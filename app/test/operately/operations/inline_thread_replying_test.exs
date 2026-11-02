defmodule Operately.Operations.InlineThreadReplyingTest do
  use Operately.DataCase
  alias Operately.Operations.{InlineThreadReplying, InlineThreadResolving, InlineThreadReopening}
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, content: RichText.rich_text("Hello world"))
    |> Factory.add_inline_thread(:thread, :document, from: 1, to: 6, quote: "Hello")
  end

  test "resolved threads reject replies even with a stale thread struct", ctx do
    {:ok, _} = InlineThreadResolving.run(ctx.creator, ctx.thread)
    before = document_state(ctx)
    activity_count = Repo.aggregate(Operately.Activities.Activity, :count)

    assert {:error, :thread_resolved} = InlineThreadReplying.run(ctx.creator, ctx.thread, RichText.rich_text("Reply"))
    assert length(Repo.preload(ctx.thread, :messages, force: true).messages) == 1
    assert document_state(ctx) == before
    assert Repo.aggregate(Operately.Activities.Activity, :count) == activity_count
  end

  test "reopened threads allow replies without changing the document", ctx do
    {:ok, resolved} = InlineThreadResolving.run(ctx.creator, ctx.thread)
    {:ok, _} = InlineThreadReopening.run(ctx.creator, resolved)
    before = document_state(ctx)
    activity_count = Repo.aggregate(Operately.Activities.Activity, :count)

    assert {:ok, thread} = InlineThreadReplying.run(ctx.creator, resolved, RichText.rich_text("Reply"))
    assert thread.resolved_at == nil
    assert length(thread.messages) == 2
    assert Enum.any?(thread.messages, &(&1.content == RichText.rich_text("Reply")))
    assert document_state(ctx) == before
    assert Repo.aggregate(Operately.Activities.Activity, :count) == activity_count + 1
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
      notifications: Repo.aggregate(Operately.Notifications.Notification, :count)
    }
  end
end
