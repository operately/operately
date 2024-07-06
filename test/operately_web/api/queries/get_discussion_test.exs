defmodule OperatelyWeb.Api.Queries.GetDiscussionTest do
  alias Operately.Support.RichText
  use OperatelyWeb.TurboCase

  import Operately.UpdatesFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_people, %{})
    end
  end

  describe "get_discussion functionality" do
    setup :register_and_log_in_account

    test "include_author", ctx do
      discussion = create_discussion(ctx)

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.discussion_id(discussion)})
      assert res.discussion.author == nil

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.discussion_id(discussion), include_author: true})
      assert res.discussion.author == Serializer.serialize(ctx.person, level: :essential)
    end

    test "include_reactions", ctx do
      discussion = create_discussion(ctx)

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.discussion_id(discussion)})
      assert res.discussion.reactions == nil

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.discussion_id(discussion), include_reactions: true})
      assert res.discussion.reactions == []

      {:ok, reaction} = Operately.Updates.create_reaction(%{
        person_id: ctx.person.id,
        entity_id: discussion.id,
        entity_type: :update,
        emoji: "👍"
      })

      reaction = Operately.Repo.preload(reaction, [:person])

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.discussion_id(discussion), include_reactions: true})
      assert res.discussion.reactions == [Serializer.serialize(reaction, level: :essential)]
    end

    test "include_comments", ctx do
      discussion = create_discussion(ctx)

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.discussion_id(discussion)})
      assert res.discussion.comments == nil

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.discussion_id(discussion), include_comments: true})
      assert res.discussion.comments == []

      {:ok, comment} = add_comment(ctx, discussion, "Hello World")
      {:ok, _reaction} = Operately.Updates.create_reaction(%{
        person_id: ctx.person.id,
        entity_id: comment.id,
        entity_type: :comment,
        emoji: "👍"
      })

      comment = Operately.Repo.preload(comment, [:author, [reactions: :person]])

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.discussion_id(discussion), include_comments: true})
      assert res.discussion.comments == [Serializer.serialize(comment, level: :essential)]
    end
  end

  def create_discussion(ctx, title \\ "Hello World", body \\ "How are you doing?") do
    update_fixture(%{
      author_id: ctx.person.id,
      updatable_id: ctx.company.company_space_id,
      updatable_type: :space,
      type: :project_discussion,
      content: %{
        title: title,
        body: RichText.rich_text(body)
      }
    })
  end

  def add_comment(ctx, discussion, content) do
    Operately.Operations.CommentAdding.run(ctx.person, discussion.id, "update", RichText.rich_text(content))
  end
end 
