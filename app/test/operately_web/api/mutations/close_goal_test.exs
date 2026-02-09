defmodule OperatelyWeb.Api.Mutations.CloseGoalTest do
  use OperatelyWeb.TurboCase

  import Operately.Support.RichText
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures

  alias Operately.Repo
  alias Operately.Access.Binding
  alias OperatelyWeb.Paths
  alias Operately.Notifications.SubscriptionList
  alias Operately.Activities.Activity

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :close_goal, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      goal: :full_access,    expected: 200},

      %{company: :no_access,      space: :comment_access, goal: :no_access,      expected: 403},
      %{company: :no_access,      space: :edit_access,    goal: :no_access,      expected: 200},
      %{company: :no_access,      space: :full_access,    goal: :no_access,      expected: 200},

      %{company: :comment_access, space: :no_access,      goal: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      goal: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      goal: :no_access,      expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)

        assert {code, res} = request(ctx.conn, goal)

        assert code == @test.expected

        case @test.expected do
          200 -> assert_goal_closed(goal, ctx.person)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "close_goal functionality" do
    setup :register_and_log_in_account

    test "closes goal", ctx do
      goal = create_goal(ctx)

      refute_goal_closed(goal)

      assert {200, res} = request(ctx.conn, goal)

      goal = Repo.reload(goal)
      assert_goal_closed(goal, ctx.person)
      assert res.goal == Serializer.serialize(goal)
    end
  end

  describe "subscriptions to notifications" do
    setup :register_and_log_in_account
    setup ctx do
      goal = create_goal(ctx)
      people = Enum.map(1..3, fn _ ->
        person_fixture(%{company_id: ctx.company.id})
      end)

      Map.merge(ctx, %{goal: goal, people: people})
    end

    test "creates subscription list for goal closing", ctx do
      assert {200, _} = mutation(ctx.conn, :close_goal, %{
        goal_id: Paths.goal_id(ctx.goal),
        success: "yes",
        success_status: "achieved",
        retrospective: rich_text("Closing retrospective") |> Jason.encode!(),
        send_notifications_to_everyone: true,
        subscriber_ids: Enum.map(ctx.people, &(Paths.person_id(&1)))
      })

      thread = fetch_thread(ctx.goal)
      {:ok, list} = SubscriptionList.get(:system, parent_id: thread.id, opts: [preload: :subscriptions])

      assert list.send_to_everyone
      assert length(list.subscriptions) == 4

      Enum.each([ctx.person | ctx.people], fn p ->
        assert Enum.any?(list.subscriptions, &(&1.person_id == p.id))
      end)

      assert thread.subscription_list_id == list.id
    end

    test "adds mentioned people to subscription list", ctx do
      people = ctx.people ++ ctx.people ++ ctx.people
      content = rich_text(mentioned_people: people)

      assert {200, _} = mutation(ctx.conn, :close_goal, %{
        goal_id: Paths.goal_id(ctx.goal),
        success: "yes",
        success_status: "missed",
        retrospective: content,
        send_notifications_to_everyone: false,
        subscriber_ids: []
      })

      thread = fetch_thread(ctx.goal)
      subscriptions = fetch_subscriptions(thread.id)

      assert length(subscriptions) == 4

      Enum.each([ctx.person | ctx.people], fn p ->
        assert Enum.filter(subscriptions, &(&1.person_id == p.id))
      end)
    end

    test "doesn't create repeated subscription", ctx do
      people = [ctx.person | ctx.people]
      content = rich_text(mentioned_people: people)

      assert {200, _} = mutation(ctx.conn, :close_goal, %{
        goal_id: Paths.goal_id(ctx.goal),
        success: "yes",
        success_status: "achieved",
        retrospective: content,
        send_notifications_to_everyone: true,
        subscriber_ids: Enum.map(people, &(Paths.person_id(&1))),
      })

      thread = fetch_thread(ctx.goal)
      subscriptions = fetch_subscriptions(thread.id)

      assert length(subscriptions) == 4

      Enum.each(people, fn p ->
        assert Enum.filter(subscriptions, &(&1.person_id == p.id))
      end)
    end
  end

  #
  # Steps
  #

  defp request(conn, goal) do
    mutation(conn, :close_goal, %{
      goal_id: Paths.goal_id(goal),
      success: "yes",
      success_status: "achieved",
      retrospective: rich_text("result") |> Jason.encode!(),
    })
  end

  defp refute_goal_closed(goal) do
    goal = Repo.reload(goal)

    refute goal.closed_at
    refute goal.closed_by_id
    refute goal.success
  end

  defp assert_goal_closed(goal, author) do
    goal = Repo.reload(goal)

    assert goal.closed_at
    assert goal.success
    assert goal.closed_by_id == author.id
  end

  #
  # Helpers
  #

  defp create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  defp create_goal(ctx) do
    goal_fixture(ctx.person, %{
      space_id: ctx.company.company_space_id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    })
  end

  defp create_goal(ctx, space, company_members_level, space_members_level, goal_member_level) do
    goal_attrs = %{
      space_id: space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    }

    goal_attrs = if goal_member_level != :no_access do
      Map.merge(goal_attrs, %{reviewer_id: ctx.person.id})
    else
      goal_attrs
    end

    goal = goal_fixture(ctx.creator, goal_attrs)

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    Operately.Repo.preload(goal, :access_context)
  end

  defp fetch_subscriptions(parent_id) do
    {:ok, list} = SubscriptionList.get(:system, parent_id: parent_id, opts: [preload: :subscriptions])

    list.subscriptions
  end

  defp fetch_thread(goal) do
    import Ecto.Query, only: [from: 2]

    activity = from(a in Activity,
      where: a.action == "goal_closing" and a.content["goal_id"] == ^goal.id,
      order_by: [desc: a.inserted_at],
      limit: 1,
      preload: [:comment_thread]
    )
    |> Repo.one()

    activity.comment_thread
  end
end
