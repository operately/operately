defmodule OperatelyWeb.Api.Mutations.EditDiscussionTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.MessagesFixtures

  alias Operately.Support.RichText
  alias Operately.{Repo, Access}
  alias Operately.Access.Binding
  alias Operately.Notifications
  alias Operately.Notifications.SubscriptionList

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_discussion, %{})
    end
  end

  describe "company permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator_id: creator.id})
    end

    test "company member can see only their company", ctx do
      other_ctx = register_and_log_in_account(ctx)
      message = message_fixture(ctx.creator_id, ctx.company.company_space_id)

      assert {404, res} = request(other_ctx.conn, message)
      assert res.message == "The requested resource was not found"
    end

    test "company members without edit access can't edit discussion", ctx do
      message = message_fixture(ctx.creator_id, ctx.company.company_space_id)

      assert {403, res} = request(ctx.conn, message)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company members with edit access can edit discussion", ctx do
      give_person_edit_access(ctx)
      message = message_fixture(ctx.creator_id, ctx.company.company_space_id)

      assert {200, _} = request(ctx.conn, message)
      assert_discussion_edited(message)
    end

    test "company owners can edit discussion", ctx do
      message = message_fixture(ctx.creator_id, ctx.company.company_space_id)

      # Not owner
      assert {403, _} = request(ctx.conn, message)

      # Owner
      {:ok, _} = Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, _} = request(ctx.conn, message)
      assert_discussion_edited(message)
    end
  end

  describe "space permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator_id: creator.id, space_id: space.id})
    end

    test "company member without view access can't see space", ctx do
      message = message_fixture(ctx.creator_id, ctx.space_id)

      assert {404, res} = request(ctx.conn, message)
      assert res.message == "The requested resource was not found"
    end

    test "space member without edit access can't edit discussion", ctx do
      message = message_fixture(ctx.creator_id, ctx.space_id)
      add_person_to_space(ctx, Binding.comment_access())

      assert {403, res} = request(ctx.conn, message)
      assert res.message == "You don't have permission to perform this action"
    end

    test "space members with edit access can edit discussion", ctx do
      message = message_fixture(ctx.creator_id, ctx.space_id)
      add_person_to_space(ctx, Binding.edit_access())

      assert {200, _} = request(ctx.conn, message)
      assert_discussion_edited(message)
    end

    test "company owner can edit discussion", ctx do
      message = message_fixture(ctx.creator_id, ctx.space_id)

      # Not owner
      assert {404, _} = request(ctx.conn, message)

      # Owner
      {:ok, _} = Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, _} = request(ctx.conn, message)
      assert_discussion_edited(message)
    end
  end

  describe "edit_discussion functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      ctx
    end

    test "edits discussion", ctx do
      message = message_fixture(ctx.person.id, ctx.company.company_space_id)

      assert {200, _} = request(ctx.conn, message)
      assert_discussion_edited(message)
    end

    test "mentioned people are added to subscriptions list", ctx do
      message = message_fixture(ctx.person.id, ctx.company.company_space_id)

      {:ok, list} = SubscriptionList.get(:system, parent_id: message.id, opts: [
        preload: :subscriptions
      ])

      subscriptions = Enum.filter(list.subscriptions, &(&1.person_id != ctx.person.id))
      assert subscriptions == []

      assert {200, _} = mutation(ctx.conn, :edit_discussion, %{
        discussion_id: Paths.message_id(message),
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
      discussion_id: Paths.message_id(message),
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

  defp give_person_edit_access(ctx) do
    group = Access.get_group!(company_id: ctx.company.id, tag: :standard)
    context = Access.get_context!(group_id: ctx.company.company_space_id)

    Access.get_binding!(group_id: group.id, context_id: context.id)
    |> Access.update_binding(%{access_level: Binding.edit_access()})
  end

  defp add_person_to_space(ctx, access_level) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      access_level: access_level,
    }])
  end
end
