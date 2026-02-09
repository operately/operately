defmodule OperatelyWeb.Api.Mutations.EditDiscussionTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.MessagesFixtures

  alias Operately.Repo
  alias Operately.Support.RichText
  alias Operately.Access.Binding
  alias Operately.Notifications
  alias Operately.Notifications.SubscriptionList

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_discussion, %{})
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
      test "company member with #{@test.permissions} can #{if @test.expected == 200, do: "edit", else: "not edit"} discussion", ctx do
        ctx = Factory.add_space(ctx, :space, company_permissions: Binding.from_atom(@test.permissions))
        message = create_message(ctx.creator.id, ctx.space.id)

        assert {code, res} = request(ctx.conn, message)
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert_discussion_edited(message)
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
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator_id: creator.id, space_id: space.id})
    end

    tabletest @table do
      test "space member with #{@test.space} can #{if @test.expected == 200, do: "edit", else: "not edit"} discussion", ctx do
        message = create_message(ctx.creator_id, ctx.space_id)
        add_person_to_space(ctx, Binding.from_atom(@test.space))

        assert {code, res} = request(ctx.conn, message)
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert_discussion_edited(message)
          403 ->
            assert res.message == "You don't have permission to perform this action"
          404 ->
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "edit_discussion functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      ctx
    end

    test "edits discussion", ctx do
      message = create_message(ctx.person.id, ctx.company.company_space_id)

      assert {200, _} = request(ctx.conn, message)
      assert_discussion_edited(message)
    end

    test "mentioned people are added to subscriptions list", ctx do
      message = create_message(ctx.person.id, ctx.company.company_space_id)

      {:ok, list} = SubscriptionList.get(:system, parent_id: message.id, opts: [
        preload: :subscriptions
      ])

      subscriptions = Enum.filter(list.subscriptions, &(&1.person_id != ctx.person.id))
      assert subscriptions == []

      assert {200, _} = mutation(ctx.conn, :edit_discussion, %{
        id: Paths.message_id(message),
        title: "New title",
        body: RichText.rich_text(mentioned_people: [ctx.company_creator]),
      })

      subscriptions =
        Notifications.list_subscriptions(list)
        |> Enum.filter(&(&1.person_id != ctx.person.id))

      assert length(subscriptions) == 1
      assert hd(subscriptions).person_id == ctx.company_creator.id
    end
  end

  #
  # Steps
  #

  defp request(conn, message) do
    mutation(conn, :edit_discussion, %{
      id: Paths.message_id(message),
      title: "New title",
      body: RichText.rich_text("New body", :as_string),
    })
  end

  defp assert_discussion_edited(message) do
    message = Repo.reload(message)

    assert message.title == "New title"
    assert message.body == RichText.rich_text("New body")
  end

  #
  # Helpers
  #

  defp add_person_to_space(ctx, access_level) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      access_level: access_level,
    }])
  end

  defp create_message(person_id, space_id) do
      board = messages_board_fixture(space_id)
      message_fixture(person_id, board.id)
  end
end
