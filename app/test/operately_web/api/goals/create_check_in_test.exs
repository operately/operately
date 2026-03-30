defmodule OperatelyWeb.Api.Goals.CreateCheckInTest do
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
      assert {401, _} = mutation(ctx.conn, [:goals, :create_check_in], %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access, space: :no_access, goal: :no_access, expected: 404},
      %{company: :no_access, space: :no_access, goal: :champion, expected: 200},
      %{company: :no_access, space: :no_access, goal: :reviewer, expected: 200},
      %{company: :no_access, space: :comment_access, goal: :no_access, expected: 403},
      %{company: :no_access, space: :edit_access, goal: :no_access, expected: 200},
      %{company: :no_access, space: :full_access, goal: :no_access, expected: 200},
      %{company: :comment_access, space: :no_access, goal: :no_access, expected: 403},
      %{company: :edit_access, space: :no_access, goal: :no_access, expected: 200},
      %{company: :full_access, space: :no_access, goal: :no_access, expected: 200}
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

        assert {code, res} =
                 mutation(ctx.conn, [:goals, :create_check_in], %{
                   goal_id: Paths.goal_id(goal),
                   status: "on_track",
                   content: RichText.rich_text("Content", :as_string),
                   new_target_values: new_target_values(goal),
                   due_date: %{date: "2028-12-31", date_type: "day", value: "Dec 31, 2028"},
                   checklist: []
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

      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_check_in], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 status: "caution",
                 content: RichText.rich_text("Content", :as_string),
                 new_target_values: new_target_values(ctx.goal),
                 checklist: [],
                 due_date: %{date: "2028-12-31", date_type: "day", value: "Dec 31, 2028"}
               })

      updates = Goals.list_updates(ctx.goal)

      assert length(updates) == 1
      assert res.update == Serializer.serialize(hd(updates), level: :full)
    end

    test "clearing the due date", ctx do
      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_check_in], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 status: "caution",
                 content: RichText.rich_text("Content", :as_string),
                 new_target_values: new_target_values(ctx.goal),
                 checklist: [],
                 due_date: nil
               })

      updates = Goals.list_updates(ctx.goal)

      assert length(updates) == 1
      assert res.update.timeframe == nil
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

    test "creates subscription list for goal update", ctx do
      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_check_in], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 status: "off_track",
                 content: RichText.rich_text("Content", :as_string),
                 new_target_values: new_target_values(ctx.goal),
                 send_notifications_to_everyone: true,
                 subscriber_ids: Enum.map(ctx.people, &Paths.person_id(&1)),
                 due_date: nil,
                 checklist: []
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

      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_check_in], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 status: "on_track",
                 content: content,
                 new_target_values: new_target_values(ctx.goal),
                 send_notifications_to_everyone: false,
                 subscriber_ids: [],
                 due_date: nil,
                 checklist: []
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

      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_check_in], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 status: "caution",
                 content: content,
                 new_target_values: new_target_values(ctx.goal),
                 send_notifications_to_everyone: true,
                 subscriber_ids: Enum.map(people, &Paths.person_id(&1)),
                 due_date: nil,
                 checklist: []
               })

      subscriptions = fetch_subscriptions(res)

      assert length(subscriptions) == 4

      Enum.each(people, fn p ->
        assert Enum.filter(subscriptions, &(&1.person_id == p.id))
      end)
    end
  end

  describe "checklist functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      goal = goal_fixture(ctx.person, %{space_id: ctx.company.company_space_id})

      check1 = create_check(goal, ctx.person, %{name: "Check 1", index: 0, completed: false})
      check2 = create_check(goal, ctx.person, %{name: "Check 2", index: 1, completed: false})
      check3 = create_check(goal, ctx.person, %{name: "Check 3", index: 2, completed: true})

      Map.merge(ctx, %{goal: goal, check1: check1, check2: check2, check3: check3})
    end

    test "updates checklist when provided", ctx do
      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_check_in], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 status: "on_track",
                 content: RichText.rich_text("Content", :as_string),
                 new_target_values: new_target_values(ctx.goal),
                 due_date: nil,
                 checklist: [
                   %{id: encode_check_id(ctx.check1), name: ctx.check1.name, completed: true, index: 0},
                   %{id: encode_check_id(ctx.check2), name: ctx.check2.name, completed: true, index: 1},
                   %{id: encode_check_id(ctx.check3), name: ctx.check3.name, completed: false, index: 2}
                 ]
               })

      check1_updated = Operately.Repo.get!(Operately.Goals.Check, ctx.check1.id)
      check2_updated = Operately.Repo.get!(Operately.Goals.Check, ctx.check2.id)
      check3_updated = Operately.Repo.get!(Operately.Goals.Check, ctx.check3.id)

      assert check1_updated.completed == true
      assert check2_updated.completed == true
      assert check3_updated.completed == false
      assert res.update != nil
    end

    test "does not update checklist when omitted", ctx do
      original_check1_completed = ctx.check1.completed
      original_check2_completed = ctx.check2.completed
      original_check3_completed = ctx.check3.completed

      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_check_in], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 status: "on_track",
                 content: RichText.rich_text("Content", :as_string),
                 new_target_values: new_target_values(ctx.goal),
                 due_date: nil
               })

      check1_after = Operately.Repo.get!(Operately.Goals.Check, ctx.check1.id)
      check2_after = Operately.Repo.get!(Operately.Goals.Check, ctx.check2.id)
      check3_after = Operately.Repo.get!(Operately.Goals.Check, ctx.check3.id)

      assert check1_after.completed == original_check1_completed
      assert check2_after.completed == original_check2_completed
      assert check3_after.completed == original_check3_completed
      assert res.update != nil
    end

    test "updates only specified checks in checklist", ctx do
      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_check_in], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 status: "caution",
                 content: RichText.rich_text("Content", :as_string),
                 new_target_values: new_target_values(ctx.goal),
                 due_date: nil,
                 checklist: [
                   %{id: encode_check_id(ctx.check1), name: ctx.check1.name, completed: true, index: 0}
                 ]
               })

      check1_updated = Operately.Repo.get!(Operately.Goals.Check, ctx.check1.id)
      check2_unchanged = Operately.Repo.get!(Operately.Goals.Check, ctx.check2.id)
      check3_unchanged = Operately.Repo.get!(Operately.Goals.Check, ctx.check3.id)

      assert check1_updated.completed == true
      assert check2_unchanged.completed == false
      assert check3_unchanged.completed == true
      assert res.update != nil
    end

    test "handles empty checklist array", ctx do
      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_check_in], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 status: "off_track",
                 content: RichText.rich_text("Content", :as_string),
                 new_target_values: new_target_values(ctx.goal),
                 due_date: nil,
                 checklist: []
               })

      check1_unchanged = Operately.Repo.get!(Operately.Goals.Check, ctx.check1.id)
      check2_unchanged = Operately.Repo.get!(Operately.Goals.Check, ctx.check2.id)
      check3_unchanged = Operately.Repo.get!(Operately.Goals.Check, ctx.check3.id)

      assert check1_unchanged.completed == false
      assert check2_unchanged.completed == false
      assert check3_unchanged.completed == true
      assert res.update != nil
    end

    test "checklist parameter can be omitted with other optional parameters", ctx do
      people = [person_fixture(%{company_id: ctx.company.id})]

      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_check_in], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 status: "on_track",
                 content: RichText.rich_text("Content", :as_string),
                 new_target_values: new_target_values(ctx.goal),
                 due_date: nil,
                 send_notifications_to_everyone: true,
                 subscriber_ids: Enum.map(people, &Paths.person_id(&1))
               })

      check1_unchanged = Operately.Repo.get!(Operately.Goals.Check, ctx.check1.id)
      check2_unchanged = Operately.Repo.get!(Operately.Goals.Check, ctx.check2.id)

      assert check1_unchanged.completed == false
      assert check2_unchanged.completed == false
      assert res.update != nil
    end
  end

  describe "target values functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      goal = goal_fixture(ctx.person, %{space_id: ctx.company.company_space_id})
      targets = Goals.list_targets(goal.id)

      Map.merge(ctx, %{goal: goal, targets: targets})
    end

    test "updates targets when provided", ctx do
      original_target_values = Enum.map(ctx.targets, & &1.value)
      new_values = Enum.map(ctx.targets, & &1.value + 50)

      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_check_in], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 status: "on_track",
                 content: RichText.rich_text("Content", :as_string),
                 new_target_values: new_target_values(ctx.goal),
                 checklist: [],
                 due_date: nil
               })

      updated_targets = Goals.list_targets(ctx.goal.id)
      updated_values = Enum.map(updated_targets, & &1.value)

      assert updated_values == new_values
      refute updated_values == original_target_values
      assert res.update != nil
    end

    test "does not update targets when omitted", ctx do
      original_target_values = Enum.map(ctx.targets, & &1.value)

      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_check_in], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 status: "on_track",
                 content: RichText.rich_text("Content", :as_string),
                 checklist: [],
                 due_date: nil
               })

      targets_after = Goals.list_targets(ctx.goal.id)
      values_after = Enum.map(targets_after, & &1.value)

      assert values_after == original_target_values
      assert res.update != nil
    end

    test "updates only specified targets", ctx do
      first_target = hd(ctx.targets)
      original_values = Enum.map(ctx.targets, & &1.value)

      partial_update = [%{id: first_target.id, value: first_target.value + 100}]
      |> Jason.encode!()

      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_check_in], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 status: "caution",
                 content: RichText.rich_text("Content", :as_string),
                 new_target_values: partial_update,
                 checklist: [],
                 due_date: nil
               })

      updated_targets = Goals.list_targets(ctx.goal.id)
      first_updated = Enum.find(updated_targets, fn t -> t.id == first_target.id end)

      assert first_updated.value == first_target.value + 100
      assert res.update != nil
    end

    test "handles empty target values array", ctx do
      original_target_values = Enum.map(ctx.targets, & &1.value)

      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_check_in], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 status: "off_track",
                 content: RichText.rich_text("Content", :as_string),
                 new_target_values: "[]",
                 checklist: [],
                 due_date: nil
               })

      targets_after = Goals.list_targets(ctx.goal.id)
      values_after = Enum.map(targets_after, & &1.value)

      assert values_after == original_target_values
      assert res.update != nil
    end

    test "target values can be omitted with other optional parameters", ctx do
      people = [person_fixture(%{company_id: ctx.company.id})]
      original_target_values = Enum.map(ctx.targets, & &1.value)

      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_check_in], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 status: "on_track",
                 content: RichText.rich_text("Content", :as_string),
                 checklist: [],
                 due_date: nil,
                 send_notifications_to_everyone: true,
                 subscriber_ids: Enum.map(people, &Paths.person_id(&1))
               })

      targets_after = Goals.list_targets(ctx.goal.id)
      values_after = Enum.map(targets_after, & &1.value)

      assert values_after == original_target_values
      assert res.update != nil
    end

    test "both targets and checklist can be omitted together", ctx do
      original_target_values = Enum.map(ctx.targets, & &1.value)

      assert {200, res} =
               mutation(ctx.conn, [:goals, :create_check_in], %{
                 goal_id: Paths.goal_id(ctx.goal),
                 status: "caution",
                 content: RichText.rich_text("Content", :as_string),
                 due_date: nil
               })

      targets_after = Goals.list_targets(ctx.goal.id)
      values_after = Enum.map(targets_after, & &1.value)

      assert values_after == original_target_values
      assert res.update != nil
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

  defp create_check(goal, creator, attrs) do
    attrs = Enum.into(attrs, %{goal_id: goal.id, creator_id: creator.id})
    {:ok, check} = Operately.Repo.insert(Operately.Goals.Check.changeset(attrs))
    check
  end

  defp encode_check_id(check) do
    Operately.ShortUuid.encode!(check.id)
  end

  defp new_target_values(goal) do
    Goals.list_targets(goal.id)
    |> Enum.map(fn t -> %{id: t.id, value: t.value + 50} end)
    |> Jason.encode!()
  end

  defp create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  defp create_goal(ctx, space, company_members_level, space_members_level, goal_member_level) do
    attrs =
      case goal_member_level do
        :champion -> [champion_id: ctx.person.id]
        :reviewer -> [reviewer_id: ctx.person.id]
        _ -> []
      end

    goal =
      goal_fixture(
        ctx.creator,
        Enum.into(attrs, %{
          space_id: space.id,
          company_access_level: Binding.from_atom(company_members_level),
          space_access_level: Binding.from_atom(space_members_level)
        })
      )

    if space_members_level != :no_access do
      {:ok, _} =
        Operately.Groups.add_members(ctx.creator, space.id, [
          %{
            id: ctx.person.id,
            access_level: Binding.from_atom(space_members_level)
          }
        ])
    end

    goal
  end
end
