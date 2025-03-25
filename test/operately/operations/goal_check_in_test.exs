defmodule Operately.Operations.GoalCheckInTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures

  alias Operately.Groups
  alias Operately.Support.RichText
  alias Operately.Access.Binding
  alias Operately.Operations.GoalCheckIn

  setup ctx do
    company = company_fixture()
    champion = person_fixture_with_account(%{company_id: company.id})
    reviewer = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(champion)

    goal =
      goal_fixture(champion, %{
        space_id: space.id,
        reviewer_id: reviewer.id,
        champion_id: champion.id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.comment_access()
      })

    Map.merge(ctx, %{company: company, space: space, champion: champion, reviewer: reviewer, goal: goal})
  end

  describe "last update" do
    test "creating goal update sets last update on the goal", ctx do
      {:ok, update} =
        GoalCheckIn.run(ctx.champion, ctx.goal, %{
          goal_id: ctx.goal.id,
          status: "on_track",
          target_values: [],
          content: RichText.rich_text("Some content"),
          send_to_everyone: true,
          subscriber_ids: [],
          subscription_parent_type: :goal_update
        })

      goal = Repo.get!(Operately.Goals.Goal, ctx.goal.id)
      assert goal.last_check_in_id == update.id
    end
  end

  describe "notifications" do
    test "Creating goal update notifies everyone", ctx do
      members = create_space_members(ctx)

      {:ok, update} =
        Oban.Testing.with_testing_mode(:manual, fn ->
          GoalCheckIn.run(ctx.champion, ctx.goal, %{
            goal_id: ctx.goal.id,
            status: "on_track",
            target_values: [],
            content: RichText.rich_text("Some content"),
            send_to_everyone: true,
            subscriber_ids: [],
            subscription_parent_type: :goal_update
          })
        end)

      action = "goal_check_in"
      activity = get_activity(update, action)

      assert 0 == notifications_count(action: action)

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)

      # 3 members + reviewer
      assert 4 == notifications_count(action: action)

      members
      |> Enum.filter(&(&1.id != ctx.champion.id))
      |> Enum.each(fn p ->
        assert Enum.find(notifications, &(&1.person_id == p.id))
      end)
    end

    test "Creating goal update notifies selected people", ctx do
      create_space_members(ctx)

      {:ok, update} =
        Oban.Testing.with_testing_mode(:manual, fn ->
          GoalCheckIn.run(ctx.champion, ctx.goal, %{
            goal_id: ctx.goal.id,
            status: "caution",
            target_values: [],
            content: RichText.rich_text("Some content"),
            send_to_everyone: false,
            subscriber_ids: [ctx.reviewer.id, ctx.champion.id],
            subscription_parent_type: :goal_update
          })
        end)

      action = "goal_check_in"
      activity = get_activity(update, action)

      assert 0 == notifications_count(action: action)

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)

      assert 1 == notifications_count(action: action)
      assert hd(notifications).person_id == ctx.reviewer.id
    end

    test "Person without permissions is not notified", ctx do
      # Without permissions
      person = person_fixture_with_account(%{company_id: ctx.company.id})
      content = RichText.rich_text(mentioned_people: [person]) |> Jason.decode!()

      {:ok, update} =
        GoalCheckIn.run(ctx.champion, ctx.goal, %{
          goal_id: ctx.goal.id,
          status: "issue",
          target_values: [],
          content: content,
          send_to_everyone: true,
          subscriber_ids: [],
          subscription_parent_type: :goal_update
        })

      action = "goal_check_in"
      activity = get_activity(update, action)

      assert notifications_count(action: action) == 0
      assert fetch_notifications(activity.id, action: action) == []

      # With permissions
      {:ok, _} =
        Groups.add_members(ctx.champion, ctx.space.id, [
          %{id: person.id, access_level: Binding.view_access()}
        ])

      {:ok, update} =
        GoalCheckIn.run(ctx.champion, ctx.goal, %{
          goal_id: ctx.goal.id,
          status: "issue",
          target_values: [],
          content: content,
          send_to_everyone: true,
          subscriber_ids: [],
          subscription_parent_type: :goal_update
        })

      activity = get_activity(update, action)
      notifications = fetch_notifications(activity.id, action: action)

      assert notifications_count(action: action) == 1
      assert hd(notifications).person_id == person.id
    end
  end

  describe "timeframes" do
    @action "goal_check_in"
    @old_timeframe %{ type: "year", start_date: ~D[2024-01-01], end_date: ~D[2024-12-31]}
    @new_timeframe %{ type: "days", start_date: ~D[2024-02-01], end_date: ~D[2024-03-15]}

    setup ctx do
      goal = goal_fixture(ctx.champion, %{
        space_id: ctx.space.id,
        timeframe: @old_timeframe,
      })

      Map.put(ctx, :goal, goal)
    end

    test "timeframe changed", ctx do
      {:ok, update} = GoalCheckIn.run(ctx.champion, ctx.goal, %{
        goal_id: ctx.goal.id,
        status: "on_track",
        target_values: [],
        content: RichText.rich_text("Some content"),
        timeframe: @new_timeframe,
        send_to_everyone: true,
        subscriber_ids: [],
        subscription_parent_type: :goal_update
      })

      goal = Repo.reload(ctx.goal)
      assert_timeframes(goal.timeframe, @new_timeframe)

      activity = get_activity(update, @action)
      assert_activity_timeframes(activity.content["new_timeframe"], @new_timeframe)
      assert_activity_timeframes(activity.content["old_timeframe"], @old_timeframe)
    end

    test "timeframe NOT changed", ctx do
      {:ok, update} = GoalCheckIn.run(ctx.champion, ctx.goal, %{
        goal_id: ctx.goal.id,
        status: "on_track",
        target_values: [],
        content: RichText.rich_text("Some content"),
        timeframe: @old_timeframe,
        send_to_everyone: true,
        subscriber_ids: [],
        subscription_parent_type: :goal_update
      })

      goal = Repo.reload(ctx.goal)
      assert_timeframes(goal.timeframe, @old_timeframe)

      activity = get_activity(update, @action)
      refute_timeframe_in_activity(activity)
    end

    test "timeframe NOT provided", ctx do
      {:ok, update} = GoalCheckIn.run(ctx.champion, ctx.goal, %{
        goal_id: ctx.goal.id,
        status: "on_track",
        target_values: [],
        content: RichText.rich_text("Some content"),
        send_to_everyone: true,
        subscriber_ids: [],
        subscription_parent_type: :goal_update
      })

      goal = Repo.reload(ctx.goal)
      assert_timeframes(goal.timeframe, @old_timeframe)

      activity = get_activity(update, @action)
      refute_timeframe_in_activity(activity)
    end
  end

  #
  # Steps
  #

  defp assert_timeframes(one, two) do
    assert one.type == two.type
    assert one.start_date == two.start_date
    assert one.end_date == two.end_date
  end

  defp assert_activity_timeframes(one, two) do
    assert one["type"] == two.type
    assert one["start_date"] == Date.to_string(two.start_date)
    assert one["end_date"] == Date.to_string(two.end_date)
  end

  defp refute_timeframe_in_activity(activity) do
    refute activity.content["new_timeframe"]
    refute activity.content["old_timeframe"]
  end

  #
  # Helpers
  #

  defp create_space_members(ctx) do
    people = Enum.map(1..3, fn _ -> person_fixture_with_account(%{company_id: ctx.company.id}) end)
    attrs = Enum.map(people ++ [ctx.reviewer], fn p -> %{id: p.id, access_level: Binding.edit_access()} end)
    {:ok, _} = Groups.add_members(ctx.champion, ctx.space.id, attrs)
    Groups.list_members(ctx.space)
  end

  defp get_activity(update, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["update_id"] == ^update.id
    )
    |> Repo.one()
  end
end
