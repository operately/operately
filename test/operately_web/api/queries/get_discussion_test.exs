defmodule OperatelyWeb.Api.Queries.GetDiscussionTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.MessagesFixtures

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
      message = message_fixture(ctx.creator.id,  ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.message_id(message)})
      assert_message(res)
    end

    test "company members have no access", ctx do
      space = create_space(ctx, company_access: Binding.no_access())
      message = message_fixture(ctx.creator.id,  space.id)

      assert {404, %{message: msg} = _res} = query(ctx.conn, :get_discussion, %{id: Paths.message_id(message)})
      assert msg == "The requested resource was not found"
    end

    test "company members have access", ctx do
      space = create_space(ctx, company_access: Binding.view_access())
      message = message_fixture(ctx.creator.id,  space.id)

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.message_id(message)})
      assert_message(res)
    end

    test "space members have access", ctx do
      space = create_space(ctx, company_access: Binding.no_access())
      message = message_fixture(ctx.creator.id,  space.id)
      add_person_to_space(ctx, space)

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.message_id(message)})
      assert_message(res)
    end
  end

  describe "get_discussion functionality" do
    setup :register_and_log_in_account

    test "include_space", ctx do
      message = message_fixture(ctx.person.id, ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.message_id(message)})
      assert res.discussion.space == nil

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.message_id(message), include_space: true})

      space = Operately.Groups.get_group!(ctx.company.company_space_id)
      assert res.discussion.space == Serializer.serialize(space, level: :essential)
    end

    test "include_author", ctx do
      message = message_fixture(ctx.person.id, ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.message_id(message)})
      assert res.discussion.author == nil

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.message_id(message), include_author: true})
      assert res.discussion.author == Serializer.serialize(ctx.person, level: :essential)
    end

    test "include_reactions", ctx do
      message = message_fixture(ctx.person.id, ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.message_id(message)})
      assert res.discussion.reactions == nil

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.message_id(message), include_reactions: true})
      assert res.discussion.reactions == []

      {:ok, reaction} = Operately.Updates.create_reaction(%{
        person_id: ctx.person.id,
        entity_id: message.id,
        entity_type: :message,
        emoji: "👍"
      })

      reaction = Operately.Repo.preload(reaction, [:person])

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.message_id(message), include_reactions: true})
      assert res.discussion.reactions == [Serializer.serialize(reaction, level: :essential)]
    end

    test "include_comments", ctx do
      message = message_fixture(ctx.person.id, ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.message_id(message)})
      assert res.discussion.comments == nil

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.message_id(message), include_comments: true})
      assert res.discussion.comments == []

      {:ok, comment} = add_comment(ctx, message, "Hello World")
      {:ok, _reaction} = Operately.Updates.create_reaction(%{
        person_id: ctx.person.id,
        entity_id: comment.id,
        entity_type: :comment,
        emoji: "👍"
      })

      comment = Operately.Repo.preload(comment, [:author, [reactions: :person]])

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.message_id(message), include_comments: true})
      assert res.discussion.comments == [Serializer.serialize(comment, level: :essential)]
    end
  end

  #
  # Helpers
  #

  defp assert_message(res) do
    assert res.discussion.title
    assert res.discussion.body
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

  defp add_comment(ctx, message, content) do
    Operately.Operations.CommentAdding.run(ctx.person, message, "message", RichText.rich_text(content))
  end
end
