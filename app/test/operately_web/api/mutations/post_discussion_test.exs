defmodule OperatelyWeb.Api.Mutations.PostDiscussionTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

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
    @table [
      %{permissions: :view_access, expected: 403},
      %{permissions: :comment_access, expected: 403},
      %{permissions: :edit_access, expected: 200},
      %{permissions: :full_access, expected: 200},
    ]

    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    tabletest @table do
      test "company member with #{@test.permissions} can #{if @test.expected == 200, do: "create", else: "not create"} discussion", ctx do
        ctx = Factory.add_space(ctx, :space, company_permissions: Binding.from_atom(@test.permissions))

        assert {code, res} = request(ctx.conn, ctx.space)
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert_discussion_created(res)
          403 ->
            assert res.message == "You don't have permission to perform this action"
        end
      end
    end
  end

  describe "space permissions" do
    @table [
      %{space: :no_access,      expected: 404},
      %{space: :view_access,    expected: 403},
      %{space: :comment_access, expected: 403},
      %{space: :edit_access,    expected: 200},
      %{space: :full_access,    expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space})
    end

    tabletest @table do
      test "space member with #{@test.space} can #{if @test.expected == 200, do: "create", else: "not create"} discussion", ctx do
        add_person_to_space(ctx, Binding.from_atom(@test.space))

        assert {code, res} = request(ctx.conn, ctx.space)
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert_discussion_created(res)
          403 ->
            assert res.message == "You don't have permission to perform this action"
          404 ->
            assert res.message == "The requested resource was not found"
        end
      end
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

  defp add_person_to_space(ctx, access_level) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      access_level: access_level,
    }])
  end
end
