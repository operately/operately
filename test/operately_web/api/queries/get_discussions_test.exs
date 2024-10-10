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
        message_fixture(ctx.creator.id, ctx.company.company_space_id)
      end)
      space = Operately.Groups.get_group!(ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_discussions, %{space_id: Paths.space_id(space)})
      assert_messages(res, messages)
    end

    test "company members have no access", ctx do
      space = create_space(ctx, company_permissions: Binding.no_access())
      Enum.each(1..3, fn _ ->
        message_fixture(ctx.creator.id, space.id)
      end)

      assert {200, res} = query(ctx.conn, :get_discussions, %{space_id: Paths.space_id(space)})
      assert length(res.discussions) == 0
    end

    test "company members have access", ctx do
      space = create_space(ctx, company_permissions: Binding.view_access())
      messages = Enum.map(1..3, fn _ ->
        message_fixture(ctx.creator.id, space.id)
      end)

      assert {200, res} = query(ctx.conn, :get_discussions, %{space_id: Paths.space_id(space)})
      assert_messages(res, messages)
    end

    test "space members have access", ctx do
      space = create_space(ctx, company_permissions: Binding.no_access())
      messages = Enum.map(1..3, fn _ ->
        message_fixture(ctx.creator.id, space.id)
      end)

      assert {200, res} = query(ctx.conn, :get_discussions, %{space_id: Paths.space_id(space)})
      assert length(res.discussions) == 0

      add_person_to_space(ctx, space)

      assert {200, res} = query(ctx.conn, :get_discussions, %{space_id: Paths.space_id(space)})
      assert_messages(res, messages)
    end
  end

  #
  # Helpers
  #

  defp assert_messages(res, messages) do
    assert length(res.discussions) == length(messages)
    Enum.each(res.discussions, fn m ->
      assert Enum.find(messages, &(Paths.message_id(&1) == m.id))
      assert m.author
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
end
