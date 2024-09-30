defmodule OperatelyWeb.Api.Queries.GetDiscussionTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.MessagesFixtures
  import Operately.NotificationsFixtures

  alias Operately.Access.Binding
  alias Operately.Notifications.SubscriptionList

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

    test "include_potential_subscribers", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:creator)
        |> Factory.log_in_person(:creator)
        |> Factory.add_space(:space)
        |> Factory.add_space_member(:member1, :space)
        |> Factory.add_space_member(:member2, :space)
        |> Factory.add_space_member(:member3, :space)
        |> Factory.add_message(:message, :space)

      {:ok, list} = SubscriptionList.get(:system, parent_id: ctx.message.id)
      subscription_fixture(%{subscription_list_id: list.id, person_id: ctx.creator.id})

      assert {200, res} = query(ctx.conn, :get_discussion, %{id: Paths.message_id(ctx.message)})

      refute res.discussion.potential_subscribers

      assert {200, res} = query(ctx.conn, :get_discussion, %{
        id: Paths.message_id(ctx.message),
        include_potential_subscribers: true,
      })
      subs = res.discussion.potential_subscribers

      assert length(subs) == 4

      # creator is has subscription
      creator = Enum.find(subs, &(&1.person.id == Paths.person_id(ctx.creator)))
      assert creator.is_subscribed
      refute creator.priority

      # space members are potential subscribers
      [ctx.member1, ctx.member2, ctx.member3]
      |> Enum.each(fn p ->
        sub = Enum.find(subs, &(&1.person.id == Paths.person_id(p)))
        refute sub.is_subscribed
        refute sub.priority
      end)
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
end
