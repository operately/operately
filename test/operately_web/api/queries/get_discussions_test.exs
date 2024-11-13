defmodule OperatelyWeb.Api.Queries.GetDiscussionsTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.MessagesFixtures

  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_discussions, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    test "company space - company members have access", ctx do
      messages = Enum.map(1..3, fn _ ->
        create_message(ctx.creator.id, ctx.company.company_space_id)
      end)
      space = Operately.Groups.get_group!(ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_discussions, %{space_id: Paths.space_id(space)})
      assert_messages(res, messages)
    end

    test "company members have no access", ctx do
      space = create_space(ctx, company_permissions: Binding.no_access())
      Enum.each(1..3, fn _ ->
        create_message(ctx.creator.id, space.id)
      end)

      assert {200, res} = query(ctx.conn, :get_discussions, %{space_id: Paths.space_id(space)})
      assert length(res.discussions) == 0
    end

    test "company members have access", ctx do
      space = create_space(ctx, company_permissions: Binding.view_access())
      messages = Enum.map(1..3, fn _ ->
        create_message(ctx.creator.id, space.id)
      end)

      assert {200, res} = query(ctx.conn, :get_discussions, %{space_id: Paths.space_id(space)})
      assert_messages(res, messages)
    end

    test "space members have access", ctx do
      space = create_space(ctx, company_permissions: Binding.no_access())
      messages = Enum.map(1..3, fn _ ->
        create_message(ctx.creator.id, space.id)
      end)

      assert {200, res} = query(ctx.conn, :get_discussions, %{space_id: Paths.space_id(space)})
      assert length(res.discussions) == 0

      add_person_to_space(ctx, space)

      assert {200, res} = query(ctx.conn, :get_discussions, %{space_id: Paths.space_id(space)})
      assert_messages(res, messages)
    end
  end


  describe "get_discussions functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_messages_board(:messages_board, :space)
      |> Factory.add_message(:message, :messages_board)
      |> Factory.preload(:message, :space)
      |> Factory.add_comment(:comment1, :message)
      |> Factory.add_comment(:comment2, :message)
      |> Factory.log_in_person(:creator)
    end

    test "with no includes", ctx do
      assert {200, res} = query(ctx.conn, :get_discussions, %{space_id: Paths.space_id(ctx.space)})

      assert length(res.discussions) == 1

      discussion = hd(res.discussions)

      refute discussion.author
      refute discussion.comments_count
    end

    test "include_author", ctx do
      assert {200, res} = query(ctx.conn, :get_discussions, %{
        space_id: Paths.space_id(ctx.space),
        include_author: true
      })
      discussion = hd(res.discussions)

      assert discussion.author == Serializer.serialize(ctx.creator)
    end

    test "include_comments_count", ctx do
      assert {200, res} = query(ctx.conn, :get_discussions, %{
        space_id: Paths.space_id(ctx.space),
        include_comments_count: true
      })
      discussion = hd(res.discussions)

      assert discussion.comments_count == 2
    end
  end

  #
  # Helpers
  #

  defp assert_messages(res, messages) do
    assert length(res.discussions) == length(messages)
    Enum.each(res.discussions, fn m ->
      assert Enum.find(messages, &(Paths.message_id(&1) == m.id))
      assert m.body
      assert m.title
    end)
  end

  defp create_space(ctx, attrs) do
    group_fixture(ctx.creator, Enum.into(attrs, %{company_id: ctx.company.id}))
  end

  defp add_person_to_space(ctx, space) do
    Operately.Groups.add_members(ctx.person, space.id, [%{
      id: ctx.person.id,
      access_level: Binding.view_access(),
    }])
  end

  defp create_message(creator_id, space_id) do
    board = messages_board_fixture(space_id)
    message_fixture(creator_id, board.id)
  end
end
