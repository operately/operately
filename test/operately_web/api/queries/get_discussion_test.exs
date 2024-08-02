defmodule OperatelyWeb.Api.Queries.GetDiscussionTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.UpdatesFixtures

  alias Operately.Support.RichText
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_people, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    test "(company space) - company members have access", ctx do
      discussion = create_discussion(ctx, space_id: ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.discussion_id(discussion)})
      assert_discussion(res)
    end

    test "company members have no access", ctx do
      space = create_space(ctx, company_access: Binding.no_access())
      discussion = create_discussion(ctx, space_id: space.id)

      assert {404, %{message: msg} = _res} = query(ctx.conn, :get_discussion, %{id: Paths.discussion_id(discussion)})
      assert msg == "The requested resource was not found"
    end

    test "company members have access", ctx do
      space = create_space(ctx, company_access: Binding.view_access())
      discussion = create_discussion(ctx, space_id: space.id)

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.discussion_id(discussion)})
      assert_discussion(res)
    end

    test "space members have access", ctx do
      space = create_space(ctx, company_access: Binding.no_access())
      discussion = create_discussion(ctx, space_id: space.id)
      add_person_to_space(ctx, space)

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.discussion_id(discussion)})
      assert_discussion(res)
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

  #
  # Helpers
  #

  defp assert_discussion(res) do
    assert res.discussion.title
    assert res.discussion.body
    assert res.discussion.space
  end

  defp create_space(ctx, opts) do
    group_fixture(ctx.creator, %{
      company_id: ctx.company.id,
      company_permissions: Keyword.get(opts, :company_access, Binding.no_access())
    })
  end

  defp add_person_to_space(ctx, space) do
    Operately.Groups.add_members(ctx.person, space.id, [%{
      id: ctx.person.id,
      permissions: Binding.view_access(),
    }])
  end

  defp create_discussion(ctx, opts \\ []) do
    update_fixture(%{
      author_id: ctx.person.id,
      updatable_id: Keyword.get(opts, :space_id, ctx.company.company_space_id),
      updatable_type: :space,
      type: :project_discussion,
      content: %{
        title: Keyword.get(opts, :title, "Hello World"),
        body: Keyword.get(opts, :body, "How are you doing?") |> RichText.rich_text()
      }
    })
  end

  defp add_comment(ctx, discussion, content) do
    Operately.Operations.CommentAdding.run(ctx.person, discussion.id, "update", RichText.rich_text(content))
  end
end
