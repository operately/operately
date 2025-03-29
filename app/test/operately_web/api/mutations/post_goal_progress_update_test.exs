defmodule OperatelyWeb.Api.Mutations.PostGoalProgressUpdateTest do
  use OperatelyWeb.TurboCase

  import Operately.GoalsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Goals
  alias Operately.Support.RichText
  alias Operately.Access.Binding
  alias Operately.Goals.Update
  alias Operately.Notifications.SubscriptionList

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :post_goal_progress_update, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      goal: :no_access,      expected: 404},
      %{company: :no_access,      space: :no_access,      goal: :champion,    expected: 200},
      %{company: :no_access,      space: :no_access,      goal: :reviewer,    expected: 200},

      %{company: :no_access,      space: :comment_access, goal: :no_access,      expected: 403},
      %{company: :no_access,      space: :edit_access,    goal: :no_access,      expected: 403},
      %{company: :no_access,      space: :full_access,    goal: :no_access,      expected: 200},

      %{company: :comment_access, space: :no_access,      goal: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      goal: :no_access,      expected: 403},
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

        assert {code, res} = mutation(ctx.conn, :post_goal_progress_update, %{
          goal_id: Paths.goal_id(goal),
          status: "on_track",
          content: RichText.rich_text("Content", :as_string),
          new_target_values: new_target_values(goal),
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert length(Goals.list_updates(goal)) == 1
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "post_goal_progress_update functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      goal = goal_fixture(ctx.person, %{space_id: ctx.company.company_space_id})

      Map.merge(ctx, %{goal: goal})
    end

    test "posts goal progress update", ctx do
      assert Goals.list_updates(ctx.goal) == []

      assert {200, res} = mutation(ctx.conn, :post_goal_progress_update, %{
        goal_id: Paths.goal_id(ctx.goal),
        status: "caution",
        content: RichText.rich_text("Content", :as_string),
        new_target_values: new_target_values(ctx.goal),
      })

      updates = Goals.list_updates(ctx.goal)

      assert length(updates) == 1
      assert res.update == Serializer.serialize(hd(updates), level: :full)
    end
  end

  describe "subscriptions to notifications" do
    setup :register_and_log_in_account
    setup ctx do
      goal = goal_fixture(ctx.person, %{space_id: ctx.company.company_space_id})
      people = Enum.map(1..3, fn _ ->
        person_fixture(%{company_id: ctx.company.id})
      end)

      Map.merge(ctx, %{goal: goal, people: people})
    end

    test "creates subscription list for goal update", ctx do
      assert {200, res} = mutation(ctx.conn, :post_goal_progress_update, %{
        goal_id: Paths.goal_id(ctx.goal),
        status: "issue",
        content: RichText.rich_text("Content", :as_string),
        new_target_values: new_target_values(ctx.goal),
        send_notifications_to_everyone: true,
        subscriber_ids: Enum.map(ctx.people, &(Paths.person_id(&1))),
      })

      {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.update.id)
      {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

      assert list.send_to_everyone
      assert length(list.subscriptions) == 4

      Enum.each([ctx.person | ctx.people], fn p ->
        assert Enum.filter(list.subscriptions, &(&1.person_id == p.id))
      end)

      {:ok, update} = Update.get(:system, id: id)

      assert update.subscription_list_id
    end

    test "adds mentioned people to subscription list", ctx do
      people = ctx.people ++ ctx.people ++ ctx.people
      content = RichText.rich_text(mentioned_people: people)

      assert {200, res} = mutation(ctx.conn, :post_goal_progress_update, %{
        goal_id: Paths.goal_id(ctx.goal),
        status: "pending",
        content: content,
        new_target_values: new_target_values(ctx.goal),
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

      assert {200, res} = mutation(ctx.conn, :post_goal_progress_update, %{
        goal_id: Paths.goal_id(ctx.goal),
        status: "caution",
        content: content,
        new_target_values: new_target_values(ctx.goal),
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
  # Helpers
  #

  defp fetch_subscriptions(res) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.update.id)
    {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

    list.subscriptions
  end

  defp new_target_values(goal) do
    Goals.list_targets(goal.id)
    |> Enum.map(fn t -> %{id: t.id, value: t.value + 50} end)
    |> Jason.encode!()
  end

  def create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  def create_goal(ctx, space, company_members_level, space_members_level, goal_member_level) do
    attrs = case goal_member_level do
      :champion -> [champion_id: ctx.person.id]
      :reviewer -> [reviewer_id: ctx.person.id]
      _ -> []
    end

    goal = goal_fixture(ctx.creator, Enum.into(attrs, %{
      space_id: space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    }))

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    goal
  end
end
