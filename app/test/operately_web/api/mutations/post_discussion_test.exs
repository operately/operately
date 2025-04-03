defmodule OperatelyWeb.Api.Mutations.PostDiscussionTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Support.RichText
  alias Operately.Messages.Message
  alias Operately.Notifications.SubscriptionList

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :post_discussion, %{})
    end
  end

  describe "company permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = Operately.Groups.get_group!(ctx.company.company_space_id)

      Map.merge(ctx, %{space: space})
    end

    test "company member can see only their company", ctx do
      other_ctx = register_and_log_in_account(ctx)

      assert {404, res} = request(other_ctx.conn, ctx.space)
      assert res.message == "The requested resource was not found"
    end

    test "company members without edit access can't create discussion", ctx do
      assert {403, res} = request(ctx.conn, ctx.space)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company members with edit access can create discussion", ctx do
      give_person_edit_access(ctx)

      assert {200, res} = request(ctx.conn, ctx.space)
      assert_discussion_created(res)
    end

    test "company owners can create discussion", ctx do
      # Not owner
      assert {403, _} = request(ctx.conn, ctx.space)

      # Owner
      {:ok, _} = Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, ctx.space)
      assert_discussion_created(res)
    end
  end

  describe "space permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space})
    end

    test "company member without view access can't see space", ctx do
      assert {404, res} = request(ctx.conn, ctx.space)
      assert res.message == "The requested resource was not found"
    end

    test "space member without edit access can't create discussion", ctx do
      add_person_to_space(ctx, Binding.comment_access())

      assert {403, res} = request(ctx.conn, ctx.space)
      assert res.message == "You don't have permission to perform this action"
    end

    test "space members with edit access can create discussion", ctx do
      add_person_to_space(ctx, Binding.edit_access())

      assert {200, res} = request(ctx.conn, ctx.space)
      assert_discussion_created(res)
    end

    test "company owner can create discussion", ctx do
      # Not owner
      assert {404, _} = request(ctx.conn, ctx.space)

      # Owner
      {:ok, _} = Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, ctx.space)
      assert_discussion_created(res)
    end
  end

  describe "post_discussion functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      ctx
    end

    test "creates discussion within space", ctx do
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})

      assert {200, res} = request(ctx.conn, space)
      assert_discussion_created(res)
    end

    test "creates discussion within company", ctx do
      space = Operately.Groups.get_group!(ctx.company.company_space_id)

      assert {200, res} = request(ctx.conn, space)
      assert_discussion_created(res)
    end
  end

  describe "subscriptions to notifications" do
    setup :register_and_log_in_account
    setup ctx do
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id, company_permissions: Binding.edit_access()})
      people = Enum.map(1..3, fn _ ->
        person_fixture(%{company_id: ctx.company.id})
      end)

      Map.merge(ctx, %{space: space, people: people})
    end

    test "creates subscription list for message", ctx do
      assert {200, res} = mutation(ctx.conn, :post_discussion, %{
        space_id: Paths.space_id(ctx.space),
        title: "Message",
        body: RichText.rich_text("Content", :as_string),
        send_notifications_to_everyone: true,
        subscriber_ids: Enum.map(ctx.people, &(Paths.person_id(&1))),
      })

      {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.discussion.id)
      {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

      assert list.send_to_everyone
      assert length(list.subscriptions) == 4

      Enum.each([ctx.person | ctx.people], fn p ->
        assert Enum.filter(list.subscriptions, &(&1.person_id == p.id))
      end)

      {:ok, message} = Message.get(:system, id: id)

      assert message.subscription_list_id
    end

    test "adds mentioned people to subscription list", ctx do
      people = ctx.people ++ ctx.people ++ ctx.people
      content = RichText.rich_text(mentioned_people: people)

      assert {200, res} = mutation(ctx.conn, :post_discussion, %{
        space_id: Paths.space_id(ctx.space),
        title: "Message",
        body: content,
        send_notifications_to_everyone: false,
        subscriber_ids: [],
      })

      subscriptions = fetch_subscriptions(res)

      assert length(subscriptions) == 4

      Enum.each([ctx.person | ctx.people], fn p ->
        assert Enum.filter(subscriptions, &(&1.person_id == p.id))
      end)
    end

    test "doesn't create repeated subscription", ctx do
      people = [ctx.person | ctx.people]
      content = RichText.rich_text(mentioned_people: people)

      assert {200, res} = mutation(ctx.conn, :post_discussion, %{
        space_id: Paths.space_id(ctx.space),
        title: "Message",
        body: content,
        send_notifications_to_everyone: true,
        subscriber_ids: Enum.map(people, &(Paths.person_id(&1))),
      })

      subscriptions = fetch_subscriptions(res)

      assert length(subscriptions) == 4

      Enum.each(people, fn p ->
        assert Enum.filter(subscriptions, &(&1.person_id == p.id))
      end)
    end
  end


  #
  # Steps
  #

  defp request(conn, space) do
    mutation(conn, :post_discussion, %{
      space_id: Paths.space_id(space),
      title: "Message",
      body: RichText.rich_text("Content", :as_string),
    })
  end

  defp assert_discussion_created(res) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.discussion.id)

    assert {:ok, message} = Message.get(:system, id: id)
    assert message.title == "Message"
    assert message.body == RichText.rich_text("Content")
  end

  #
  # Helpers
  #

  defp fetch_subscriptions(res) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.discussion.id)
    {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

    list.subscriptions
  end

  defp give_person_edit_access(ctx) do
    group = Access.get_group!(company_id: ctx.company.id, tag: :standard)
    context = Access.get_context!(group_id: ctx.company.company_space_id)

    Access.get_binding!(group_id: group.id, context_id: context.id)
    |> Access.update_binding(%{access_level: Binding.edit_access()})
  end

  defp add_person_to_space(ctx, access_level) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      access_level: access_level,
    }])
  end
end
