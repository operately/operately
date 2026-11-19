defmodule Operately.Operations.InlineThreadResolvingTest do
  use Operately.DataCase
  alias Operately.Support.RichText
  alias Operately.Operations.InlineThreadResolving

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, content: RichText.rich_text("Hello world"))
    |> Factory.add_inline_thread(:thread, :document, from: 1, to: 6, quote: "Hello")
  end

  test "resolution is idempotent and creates no document changes", ctx do
    before = document_state(ctx)
    activity_count = Repo.aggregate(Operately.Activities.Activity, :count)

    assert {:ok, resolved} = InlineThreadResolving.run(ctx.creator, ctx.thread)
    assert resolved.resolved_at
    assert resolved.resolved_by_id == ctx.creator.id
    assert resolved.resolved_by.id == ctx.creator.id
    assert {:ok, repeated} = InlineThreadResolving.run(ctx.creator, ctx.thread)
    assert repeated.resolved_at == resolved.resolved_at
    assert repeated.resolved_by_id == resolved.resolved_by_id
    assert document_state(ctx) == before
    assert Repo.aggregate(Operately.Activities.Activity, :count) == activity_count + 1
  end

  defp document_state(ctx) do
    %{
      document: Repo.reload!(ctx.document),
      versions: Repo.aggregate(Operately.ResourceHubs.DocumentVersion, :count),
      notifications: Repo.aggregate(Operately.Notifications.Notification, :count)
    }
  end
end
