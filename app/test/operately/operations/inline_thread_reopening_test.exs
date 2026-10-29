defmodule Operately.Operations.InlineThreadReopeningTest do
  use Operately.DataCase
  alias Operately.Support.RichText
  alias Operately.Operations.{InlineThreadReopening, InlineThreadResolving}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, content: RichText.rich_text("Hello world"))
    |> Factory.add_inline_thread(:thread, :document, from: 1, to: 6, quote: "Hello")
  end

  test "reopening clears resolution idempotently without document changes", ctx do
    {:ok, resolved} = InlineThreadResolving.run(ctx.creator, ctx.thread)
    before = document_state(ctx)
    activity_count = Repo.aggregate(Operately.Activities.Activity, :count)

    assert {:ok, reopened} = InlineThreadReopening.run(ctx.creator, resolved)
    assert reopened.resolved_at == nil
    assert reopened.resolved_by_id == nil
    assert reopened.resolved_by == nil
    assert {:ok, repeated} = InlineThreadReopening.run(ctx.creator, resolved)
    assert repeated.resolved_at == nil
    assert repeated.resolved_by_id == nil
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
