defmodule Operately.Operations.SpaceDeletingTest do
  use Operately.DataCase

  alias Operately.Comments.InlineThread
  alias Operately.Operations.{InlineThreadReplying, SpaceDeleting}
  alias Operately.Support.RichText
  alias Operately.Updates.{Comment, Reaction}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_space(:other_space)
    |> Factory.add_resource_hub(:other_hub, :other_space, :creator)
    |> Factory.add_document(:other_document, :other_hub, content: RichText.rich_text("Hello world"))
    |> Factory.add_inline_thread(:other_thread, :other_document, from: 1, to: 6, quote: "Hello")
  end

  @table [
    %{parent: :space, deleted_document: false},
    %{parent: :space, deleted_document: true},
    %{parent: :project, deleted_document: false},
    %{parent: :project, deleted_document: true},
    %{parent: :goal, deleted_document: false},
    %{parent: :goal, deleted_document: true}
  ]

  tabletest @table do
    test "removes inline messages and reactions for #{@test.parent} documents, deleted=#{@test.deleted_document}", ctx do
      ctx =
        ctx
        |> Factory.add_resource_hub(:hub, @test.parent, :creator)
        |> Factory.add_document(:document, :hub, content: RichText.rich_text("Hello world"))
        |> Factory.add_inline_thread(:thread, :document, from: 1, to: 6, quote: "Hello")

      {:ok, thread} = InlineThreadReplying.run(ctx.creator, ctx.thread, RichText.rich_text("Reply"))

      reactions =
        for message <- thread.messages do
          ctx |> Map.put(:message, message) |> Factory.add_reactions(:reaction, :message) |> Map.fetch!(:reaction)
        end

      [other_message] = ctx.other_thread.messages
      other = ctx |> Map.put(:other_message, other_message) |> Factory.add_reactions(:other_reaction, :other_message)
      maybe_delete_document(ctx.document, @test.deleted_document)

      assert {:ok, _} = ctx.space |> Repo.preload(:company) |> SpaceDeleting.run()

      assert Repo.get(InlineThread, thread.id) == nil
      assert Repo.get(Operately.ResourceHubs.Document, ctx.document.id, with_deleted: true) == nil
      for message <- thread.messages, do: assert(Repo.get(Comment, message.id) == nil)
      for reaction <- reactions, do: assert(Repo.get(Reaction, reaction.id) == nil)

      assert Repo.get!(InlineThread, ctx.other_thread.id)
      assert Repo.get!(Comment, other_message.id)
      assert Repo.get!(Reaction, other.other_reaction.id)
    end
  end

  defp maybe_delete_document(_document, false), do: :ok

  defp maybe_delete_document(document, true) do
    Repo.soft_delete!(document)
    document |> Repo.preload(:node) |> Map.fetch!(:node) |> Repo.soft_delete!()
  end
end
