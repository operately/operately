defmodule OperatelyWeb.Api.InlineThreads.GetTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.Support.Api.InlineThreads, as: Support
  alias Operately.Support.RichText

  setup ctx, do: ctx |> Support.setup() |> Support.create()

  test "returns the full thread in order to a viewer", ctx do
    for number <- 1..5, do: Support.add_reply(ctx, number)
    ctx = Support.as_member(ctx, Binding.view_access()) |> Support.read_only()

    assert {200, %{thread: thread}} = query(ctx.conn, [:inline_threads, :get], inputs(ctx))
    assert thread.id == ctx.thread.id
    assert thread.earlier_reply_count == 0
    assert Enum.map(thread.messages, &Jason.decode!(&1.content)) ==
             Enum.map(["Review this", "Reply 1", "Reply 2", "Reply 3", "Reply 4", "Reply 5"], &RichText.rich_text/1)
  end

  test "does not expose replies to a member who cannot view the document", ctx do
    ctx = ctx |> Factory.add_company_member(:viewer) |> Factory.log_in_person(:viewer)
    assert {404, _} = query(ctx.conn, [:inline_threads, :get], inputs(ctx))
  end

  test "does not expose replies after the document is deleted", ctx do
    ctx.document |> Ecto.Changeset.change(deleted_at: DateTime.utc_now()) |> Repo.update!()
    assert {404, _} = query(ctx.conn, [:inline_threads, :get], inputs(ctx))
  end

  defp inputs(ctx), do: %{resource_id: ctx.thread.resource_id, thread_id: ctx.thread.id}
end
