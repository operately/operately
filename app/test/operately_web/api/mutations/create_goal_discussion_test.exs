defmodule OperatelyWeb.Api.Mutations.CreateGoalDiscussionTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures
  import Operately.Support.RichText

  alias Operately.Repo
  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias Operately.Support.RichText
  alias Operately.Notifications.SubscriptionList

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :create_goal_discussion, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, space_id: space.id})
    end

    test "company members without view access can't see a goal", ctx do
      goal = create_goal(ctx, company_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, goal)
      assert res.message == "The requested resource was not found"
    end

    test "company members without edit access can't create a goal discussion", ctx do
      goal = create_goal(ctx, company_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, goal)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company members with edit access can create a goal discussion", ctx do
      goal = create_goal(ctx, company_access_level: Binding.edit_access())

      assert {200, res} = request(ctx.conn, goal)
      assert_discussion_created(res)
    end

    test "company owners can create a goal discussion", ctx do
      goal = create_goal(ctx, company_access_level: Binding.view_access())

      # Not owner
      assert {403, _} = request(ctx.conn, goal)

      # Owner
      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, goal)
      assert_discussion_created(res)
    end

    test "space members without view access can't see a goal", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, goal)
      assert res.message == "The requested resource was not found"
    end

    test "space members without edit access can't create a goal discussion", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, goal)
      assert res.message == "You don't have permission to perform this action"
    end

    test "space members with edit access can create a goal discussion", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.edit_access())

      assert {200, res} = request(ctx.conn, goal)
      assert_discussion_created(res)
    end

    test "space managers can create a goal discussion", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.view_access())

      # Not manager
      assert {403, _} = request(ctx.conn, goal)

      # Manager
      add_manager_to_space(ctx)
      assert {200, res} = request(ctx.conn, goal)
      assert_discussion_created(res)
    end

    test "champions can create a goal discussion", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = create_goal(ctx, champion_id: champion.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, goal)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, goal)
      assert_discussion_created(res)
    end

    test "reviewers can create a goal discussion", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = create_goal(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, goal)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, goal)
      assert_discussion_created(res)
    end
  end

  describe "create_goal_discussion functionality" do
    setup :register_and_log_in_account

    test "it creates a goal discussion", ctx do
      person = ctx.person
      goal = goal_fixture(person, %{space_id: ctx.company.company_space_id})

      assert {200, res} = request(ctx.conn, goal)
      assert_discussion_created(res)
    end

    test "if goal does not exist, it returns an error", ctx do
      assert mutation(ctx.conn, :create_goal_discussion, %{
               goal_id: "goal-abc-#{Operately.ShortUuid.encode!(Ecto.UUID.generate())}",
               title: "Some title",
               message: rich_text("Hello World") |> Jason.encode!()
             }) == not_found_response()
    end
  end

  describe "subscriptions to notifications" do
    setup :register_and_log_in_account

    setup ctx do
      goal = goal_fixture(ctx.person, %{space_id: ctx.company.company_space_id})

      people =
        Enum.map(1..3, fn _ ->
          person_fixture(%{company_id: ctx.company.id})
        end)

      Map.merge(ctx, %{goal: goal, people: people})
    end

    test "creates subscription list for goal discussion", ctx do
      assert {200, res} =
               request(ctx.conn, ctx.goal, %{
                 send_notifications_to_everyone: true,
                 subscriber_ids: Enum.map(ctx.people, &Paths.person_id(&1))
               })

      discussion = fetch_discussion(res.id)

      {:ok, list} = SubscriptionList.get(:system, parent_id: discussion.id, opts: [preload: :subscriptions])

      assert list.send_to_everyone
      assert length(list.subscriptions) == 4

      Enum.each([ctx.person | ctx.people], fn p ->
        assert Enum.filter(list.subscriptions, &(&1.person_id == p.id))
      end)

      assert discussion.subscription_list_id
    end

    test "adds mentioned people to subscription list", ctx do
      people = ctx.people ++ ctx.people ++ ctx.people
      content = RichText.rich_text(mentioned_people: people)

      assert {200, res} =
               request(ctx.conn, ctx.goal, %{
                 message: content,
                 send_notifications_to_everyone: false,
                 subscriber_ids: []
               })

      discussion = fetch_discussion(res.id)
      subscriptions = fetch_subscriptions(discussion.id)

      assert length(subscriptions) == 4

      Enum.each([ctx.person | ctx.people], fn p ->
        assert Enum.filter(subscriptions, &(&1.person_id == p.id))
      end)
    end

    test "doesn't create repeated subscription", ctx do
      people = [ctx.person | ctx.people]
      content = RichText.rich_text(mentioned_people: people)

      assert {200, res} =
               request(ctx.conn, ctx.goal, %{
                 message: content,
                 send_notifications_to_everyone: true,
                 subscriber_ids: Enum.map(people, &Paths.person_id(&1))
               })

      discussion = fetch_discussion(res.id)
      subscriptions = fetch_subscriptions(discussion.id)

      assert length(subscriptions) == 4

      Enum.each(people, fn p ->
        assert Enum.filter(subscriptions, &(&1.person_id == p.id))
      end)
    end
  end

  #
  # Steps
  #

  defp request(conn, goal, attrs \\ %{}) do
    mutation(
      conn,
      :create_goal_discussion,
      Map.merge(
        %{
          goal_id: Paths.goal_id(goal),
          title: "Some title",
          message: rich_text("Hello World") |> Jason.encode!()
        },
        attrs
      )
    )
  end

  defp assert_discussion_created(res) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.id)
    activity = Operately.Activities.get_activity!(id) |> Repo.preload(:comment_thread)

    assert activity.comment_thread_id
    assert activity.comment_thread.title == "Some title"
  end

  defp fetch_discussion(activity_id) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(activity_id)
    {:ok, activity} = Activity.get(:system, id: id, opts: [preload: :comment_thread])
    activity.comment_thread
  end

  defp fetch_subscriptions(parent_id) do
    {:ok, list} = SubscriptionList.get(:system, parent_id: parent_id, opts: [preload: :subscriptions])

    list.subscriptions
  end

  #
  # Helpers
  #

  defp create_goal(ctx, attrs) do
    goal_fixture(
      ctx[:creator] || ctx.person,
      Enum.into(attrs, %{
        space_id: ctx[:space_id] || ctx.company.company_space_id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access()
      })
    )
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [
      %{
        id: ctx.person.id,
        access_level: Binding.edit_access()
      }
    ])
  end

  defp add_manager_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [
      %{
        id: ctx.person.id,
        access_level: Binding.full_access()
      }
    ])
  end
end
