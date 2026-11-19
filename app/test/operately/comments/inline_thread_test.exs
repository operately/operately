defmodule Operately.Comments.InlineThreadTest do
  use Operately.DataCase
  alias Operately.Comments.InlineThread
  alias Operately.Operations.{InlineThreadReplying, InlineThreadResolving}
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, content: RichText.rich_text("Hello world"))
  end

  test "document edits safely detach old ranges and keep replies", ctx do
    ctx = Factory.add_inline_thread(ctx, :thread, :document, from: 1, to: 6, quote: "Hello")
    thread = ctx.thread
    assert {:ok, _} = InlineThreadReplying.run(ctx.creator, thread, RichText.rich_text("Reply"))
    document = Repo.preload(ctx.document, [:resource_hub, :node])

    assert {:ok, _} =
             Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{name: document.name, content: RichText.rich_text("Changed"), expected_version: document.current_version})

    assert [thread] = InlineThread.list(ctx.creator, resource_id: document.id, opts: InlineThread.read_options())
    assert thread.anchor.status == :unattached
    assert thread.anchor.current_from == nil
    assert thread.anchor.quote == "Hello"
    assert length(thread.messages) == 2
  end

  test "overlapping threads are independent", ctx do
    ctx =
      ctx
      |> Factory.add_inline_thread(:first, :document, from: 1, to: 6, quote: "Hello")
      |> Factory.add_inline_thread(:second, :document, from: 4, to: 9, quote: "lo wo")

    first = ctx.first
    second = ctx.second
    assert {:ok, first} = InlineThreadReplying.run(ctx.creator, first, RichText.rich_text("Reply"))
    assert length(first.messages) == 2
    assert {:ok, _} = InlineThreadResolving.run(ctx.creator, first)
    threads = InlineThread.list(ctx.creator, resource_id: ctx.document.id, opts: InlineThread.read_options())
    assert Enum.find(threads, &(&1.id == second.id)).resolved_at == nil
  end

  test "messages are listed chronologically", ctx do
    ctx = Factory.add_inline_thread(ctx, :thread, :document, from: 1, to: 6, quote: "Hello")
    thread = ctx.thread

    for text <- ["First reply", "Second reply", "Third reply"] do
      assert {:ok, _} = InlineThreadReplying.run(ctx.creator, thread, RichText.rich_text(text))
    end

    chronological = ["Third reply", "Second reply", "First reply", "Review"]

    for {text, seconds} <- Enum.with_index(chronological) do
      content = RichText.rich_text(text)
      timestamp = NaiveDateTime.add(~N[2026-10-28 12:00:00], seconds)
      Repo.update_all(from(c in Operately.Updates.Comment, where: c.entity_id == ^thread.id and c.content == ^content), set: [inserted_at: timestamp])
    end

    assert [listed] = InlineThread.list(ctx.creator, resource_id: ctx.document.id, opts: InlineThread.read_options())
    assert Enum.map(listed.messages, & &1.content) == Enum.map(chronological, &RichText.rich_text/1)
  end
end
