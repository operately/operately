defmodule Operately.Assignments.LoaderTest do
  use Operately.DataCase

  alias Operately.Assignments.Loader
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:champion, :space)
    |> Factory.add_space_member(:reviewer, :space)
  end

  describe "project check-ins" do
    test "when the next check-in date is in the past, returns as assignment", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)

      set_next_check_in_date(ctx, :project, days_ago(3))

      assignments = Loader.load(ctx.champion, ctx.company)

      assert length(assignments) == 1
      assert Enum.at(assignments, 0).resource_id == Paths.project_id(ctx.project)
    end

    test "when the next check-in date is in the today, returns as assignment", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)

      set_next_check_in_date(ctx, :project, today())

      assignments = Loader.load(ctx.champion, ctx.company)

      assert length(assignments) == 1
      assert Enum.at(assignments, 0).resource_id == Paths.project_id(ctx.project)
    end

    test "when the next check-in date is in the future, does not return as assignment", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)

      set_next_check_in_date(ctx, :project, days_from_now(3))

      assignments = Loader.load(ctx.champion, ctx.company)
      assert length(assignments) == 0
    end
  end

  describe "project check-in acknowledgements" do
    test "when the check-in is not acknowledged, returns as assignment", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)
      ctx = Factory.add_project_check_in(ctx, :check_in, :project, :champion)

      assignments = Loader.load(ctx.champion, ctx.company)

      assert length(assignments) == 1
      assert Enum.at(assignments, 0).resource_id == Paths.project_check_in_id(ctx.check_in)
    end

    test "when the check-in is acknowledged, does not return as assignment", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)
      ctx = Factory.add_project_check_in(ctx, :check_in, :project, :champion)

      acknowledge_check_ins(ctx, :check_in, :reviewer)

      assignments = Loader.load(ctx.champion, ctx.company)
      assert length(assignments) == 0
    end

    test "when the reviewer checked-in, the champion gets an assignment", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)
      ctx = Factory.add_project_check_in(ctx, :check_in, :project, :reviewer)

      assignments = Loader.load(ctx.champion, ctx.company)
      assert length(assignments) == 1
      assert Enum.at(assignments, 0).resource_id == Paths.project_check_in_id(ctx.check_in)
    end
  end

  # describe "project check-ins" do
  #   setup ctx do
  #     ctx
  #     |> Factory.add_project(:project, :space, champion: :champion, reviewer: :reviewer)
  #     |> Factory.add_project_check_in(:late_check_in1, :project, :champion)
  #     |> Factory.add_project_check_in(:late_check_in2, :project, :champion)
  #     |> Factory.add_project_check_in(:check_in1, :project, :champion)
  #     |> Factory.add_project_check_in(:check_in2, :project, :champion)
  #     |> acknowledge_check_ins()
  #   end

  #   test "returns all late check-ins", ctx do
  #     [mine: mine, reports: []] = Loader.load(ctx.reviewer, ctx.company)

  #     assert length(mine) == 2

  #     assert Enum.find(mine, &(&1.resource_id == Paths.project_check_in_id(ctx.late_check_in1)))
  #     assert Enum.find(mine, &(&1.resource_id == Paths.project_check_in_id(ctx.late_check_in2)))
  #   end

  #   test "doesn't return late check-ins to non-reviewers", ctx do
  #     [mine: [], reports: []] = Loader.load(ctx.champion, ctx.company)
  #   end
  # end

  # describe "goals" do
  #   setup ctx do
  #     ctx
  #     |> Factory.add_goal(:late_goal1, :space, champion: :champion, reviewer: :reviewer)
  #     |> Factory.add_goal(:late_goal2, :space, champion: :champion, reviewer: :reviewer)
  #     |> Factory.add_goal(:goal1, :space, champion: :champion, reviewer: :reviewer)
  #     |> Factory.add_goal(:goal2, :space, champion: :champion, reviewer: :reviewer)
  #     |> Factory.add_goal(:not_started_goal, :space,
  #       champion: :champion,
  #       reviewer: :reviewer,
  #       timeframe: Operately.ContextualDates.Timeframe.next_quarter()
  #     )
  #     |> set_update_schedule(:late_goal1, past_date())
  #     |> set_update_schedule(:late_goal2, past_date())
  #     |> set_update_schedule(:not_started_goal, past_date(2))
  #   end

  #   test "returns all late goals", ctx do
  #     [mine: mine, reports: []] = Loader.load(ctx.champion, ctx.company)

  #     assert length(mine) == 2

  #     assert Enum.find(mine, &(&1.resource_id == Paths.goal_id(ctx.late_goal1)))
  #     assert Enum.find(mine, &(&1.resource_id == Paths.goal_id(ctx.late_goal2)))
  #   end

  #   test "doesn't return late goals to non-champions", ctx do
  #     [mine: [], reports: []] = Loader.load(ctx.reviewer, ctx.company)
  #   end

  #   test "doesn't return goals not yet started", ctx do
  #     [mine: mine, reports: []] = Loader.load(ctx.champion, ctx.company)

  #     assert length(mine) == 2
  #     assert Enum.find(mine, &(&1.resource_id == Paths.goal_id(ctx.late_goal1)))
  #     assert Enum.find(mine, &(&1.resource_id == Paths.goal_id(ctx.late_goal2)))
  #   end
  # end

  # describe "goal updates" do
  #   setup ctx do
  #     ctx
  #     |> Factory.add_goal(:goal, :space, champion: :champion, reviewer: :reviewer)
  #     |> Factory.add_goal_update(:late_update1, :goal, :champion)
  #     |> Factory.add_goal_update(:late_update2, :goal, :champion)
  #     |> Factory.add_goal_update(:update1, :goal, :champion)
  #     |> Factory.add_goal_update(:update2, :goal, :champion)
  #     |> acknowledge_updates()
  #   end

  #   test "returns all late updates", ctx do
  #     [mine: mine, reports: []] = Loader.load(ctx.reviewer, ctx.company)

  #     assert length(mine) == 2

  #     assert Enum.find(mine, &(&1.resource_id == Paths.goal_update_id(ctx.late_update1)))
  #     assert Enum.find(mine, &(&1.resource_id == Paths.goal_update_id(ctx.late_update2)))
  #   end

  #   test "doesn't return late updates to non-reviewer", ctx do
  #     [mine: [], reports: []] = Loader.load(ctx.champion, ctx.company)
  #   end
  # end

  # describe "late project notifies reviewer" do
  #   setup :late_projects_setup

  #   test "only more than 3 days late", ctx do
  #     [mine: [], reports: reports] = Loader.load(ctx.reviewer, ctx.company)

  #     assert length(reports) == 2

  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_id(ctx.three_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_id(ctx.seven_days_late)))
  #   end
  # end

  # describe "late goal notifies reviewer" do
  #   setup :late_goals_setup

  #   test "only more than 3 days late", ctx do
  #     [mine: [], reports: reports] = Loader.load(ctx.reviewer, ctx.company)

  #     assert length(reports) == 2

  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_id(ctx.three_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_id(ctx.seven_days_late)))
  #   end
  # end

  # describe "late project notifies managers" do
  #   setup [:managers_setup, :late_projects_setup, :very_late_projects_setup]

  #   test "more than 5 days late", ctx do
  #     [mine: [], reports: reports] = Loader.load(ctx.manager, ctx.company)

  #     assert length(reports) == 4

  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_id(ctx.seven_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_id(ctx.twelve_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_id(ctx.fifteen_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_id(ctx.twenty_days_late)))
  #   end

  #   test "more than 10 days late", ctx do
  #     [mine: [], reports: reports] = Loader.load(ctx.senior_manager, ctx.company)

  #     assert length(reports) == 3

  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_id(ctx.twelve_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_id(ctx.fifteen_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_id(ctx.twenty_days_late)))
  #   end

  #   test "more than 15 days late", ctx do
  #     [mine: [], reports: reports] = Loader.load(ctx.director, ctx.company)

  #     assert length(reports) == 2

  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_id(ctx.twenty_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_id(ctx.fifteen_days_late)))
  #   end
  # end

  # describe "late project check-in acknowledgement notifies managers" do
  #   setup [:managers_setup, :late_project_check_in_setup]

  #   test "more than 5 days late", ctx do
  #     [mine: [], reports: reports] = Loader.load(ctx.manager, ctx.company)

  #     assert length(reports) == 4

  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_check_in_id(ctx.seven_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_check_in_id(ctx.twelve_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_check_in_id(ctx.fifteen_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_check_in_id(ctx.twenty_days_late)))
  #   end

  #   test "more than 10 days late", ctx do
  #     [mine: [], reports: reports] = Loader.load(ctx.senior_manager, ctx.company)

  #     assert length(reports) == 3

  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_check_in_id(ctx.twelve_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_check_in_id(ctx.fifteen_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_check_in_id(ctx.twenty_days_late)))
  #   end

  #   test "more than 15 days late", ctx do
  #     [mine: [], reports: reports] = Loader.load(ctx.director, ctx.company)

  #     assert length(reports) == 2

  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_check_in_id(ctx.twenty_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.project_check_in_id(ctx.fifteen_days_late)))
  #   end
  # end

  # describe "late goal notifies managers" do
  #   setup [:managers_setup, :late_goals_setup, :very_late_goals_setup]

  #   test "more than 5 days late", ctx do
  #     [mine: [], reports: reports] = Loader.load(ctx.manager, ctx.company)

  #     assert length(reports) == 4

  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_id(ctx.seven_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_id(ctx.twelve_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_id(ctx.fifteen_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_id(ctx.twenty_days_late)))
  #   end

  #   test "more than 10 days late", ctx do
  #     [mine: [], reports: reports] = Loader.load(ctx.senior_manager, ctx.company)

  #     assert length(reports) == 3

  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_id(ctx.twelve_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_id(ctx.fifteen_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_id(ctx.twenty_days_late)))
  #   end

  #   test "more than 15 days late", ctx do
  #     [mine: [], reports: reports] = Loader.load(ctx.director, ctx.company)

  #     assert length(reports) == 2

  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_id(ctx.twenty_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_id(ctx.fifteen_days_late)))
  #   end
  # end

  # describe "late goal update acknowledgement notifies managers" do
  #   setup [:managers_setup, :late_goal_update_setup]

  #   test "more than 5 days late", ctx do
  #     [mine: [], reports: reports] = Loader.load(ctx.manager, ctx.company)

  #     assert length(reports) == 4

  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_update_id(ctx.seven_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_update_id(ctx.twelve_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_update_id(ctx.fifteen_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_update_id(ctx.twenty_days_late)))
  #   end

  #   test "more than 10 days late", ctx do
  #     [mine: [], reports: reports] = Loader.load(ctx.senior_manager, ctx.company)

  #     assert length(reports) == 3

  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_update_id(ctx.twelve_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_update_id(ctx.fifteen_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_update_id(ctx.twenty_days_late)))
  #   end

  #   test "more than 15 days late", ctx do
  #     [mine: [], reports: reports] = Loader.load(ctx.director, ctx.company)

  #     assert length(reports) == 2

  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_update_id(ctx.twenty_days_late)))
  #     assert Enum.find(reports, &(&1.resource_id == Paths.goal_update_id(ctx.fifteen_days_late)))
  #   end
  # end

  # describe "management hierarchy" do
  #   setup [
  #     :managers_setup,
  #     :late_goal_update_setup,
  #     :very_late_goals_setup,
  #     :late_project_check_in_setup,
  #     :very_late_projects_setup
  #   ]

  #   test "includes management hierarchy", ctx do
  #     [mine: [], reports: reports] = Loader.load(ctx.director, ctx.company)

  #     assert length(reports) == 8

  #     Enum.each(reports, fn assignment ->
  #       [senior_manager, manager, reviewer] = assignment.management_hierarchy

  #       assert senior_manager.id == ctx.senior_manager.id
  #       assert manager.id == ctx.manager.id
  #       assert reviewer.id == ctx.reviewer.id
  #     end)
  #   end
  # end

  # #
  # # Setup
  # #

  # defp managers_setup(ctx) do
  #   ctx
  #   |> Factory.add_space_member(:manager, :space)
  #   |> Factory.set_person_manager(:reviewer, :manager)
  #   |> Factory.add_space_member(:senior_manager, :space)
  #   |> Factory.set_person_manager(:manager, :senior_manager)
  #   |> Factory.add_space_member(:director, :space)
  #   |> Factory.set_person_manager(:senior_manager, :director)
  # end

  # defp late_projects_setup(ctx) do
  #   ctx
  #   |> Factory.add_project(:not_late, :space, champion: :champion, reviewer: :reviewer)
  #   |> Factory.add_project(:two_days_late, :space, champion: :champion, reviewer: :reviewer)
  #   |> Factory.add_project(:three_days_late, :space, champion: :champion, reviewer: :reviewer)
  #   |> Factory.add_project(:seven_days_late, :space, champion: :champion, reviewer: :reviewer)
  #   |> Factory.set_project_next_check_in_date(:two_days_late, past_date(2))
  #   |> Factory.set_project_next_check_in_date(:three_days_late, past_date(3))
  #   |> Factory.set_project_next_check_in_date(:seven_days_late, past_date(7))
  # end

  # defp very_late_projects_setup(ctx) do
  #   ctx
  #   |> Factory.add_project(:twelve_days_late, :space, champion: :champion, reviewer: :reviewer)
  #   |> Factory.add_project(:fifteen_days_late, :space, champion: :champion, reviewer: :reviewer)
  #   |> Factory.add_project(:twenty_days_late, :space, champion: :champion, reviewer: :reviewer)
  #   |> Factory.set_project_next_check_in_date(:twelve_days_late, past_date(12))
  #   |> Factory.set_project_next_check_in_date(:fifteen_days_late, past_date(15))
  #   |> Factory.set_project_next_check_in_date(:twenty_days_late, past_date(20))
  # end

  # defp late_project_check_in_setup(ctx) do
  #   ctx
  #   |> Factory.add_project(:project, :space, champion: :champion, reviewer: :reviewer)
  #   |> create_late_check_in(:two_days_late, days_late: 2)
  #   |> create_late_check_in(:seven_days_late, days_late: 7)
  #   |> create_late_check_in(:twelve_days_late, days_late: 12)
  #   |> create_late_check_in(:fifteen_days_late, days_late: 15)
  #   |> create_late_check_in(:twenty_days_late, days_late: 20)
  # end

  # defp late_goal_update_setup(ctx) do
  #   ctx
  #   |> Factory.add_goal(:goal, :space, champion: :champion, reviewer: :reviewer)
  #   |> create_late_update(:two_days_late, days_late: 2)
  #   |> create_late_update(:seven_days_late, days_late: 7)
  #   |> create_late_update(:twelve_days_late, days_late: 12)
  #   |> create_late_update(:fifteen_days_late, days_late: 15)
  #   |> create_late_update(:twenty_days_late, days_late: 20)
  # end

  # defp late_goals_setup(ctx) do
  #   ctx
  #   |> Factory.add_goal(:not_late, :space, champion: :champion, reviewer: :reviewer)
  #   |> Factory.add_goal(:two_days_late, :space, champion: :champion, reviewer: :reviewer)
  #   |> Factory.add_goal(:three_days_late, :space, champion: :champion, reviewer: :reviewer)
  #   |> Factory.add_goal(:seven_days_late, :space, champion: :champion, reviewer: :reviewer)
  #   |> Factory.set_goal_next_update_date(:two_days_late, past_date(2))
  #   |> Factory.set_goal_next_update_date(:three_days_late, past_date(3))
  #   |> Factory.set_goal_next_update_date(:seven_days_late, past_date(7))
  # end

  # defp very_late_goals_setup(ctx) do
  #   ctx
  #   |> Factory.add_goal(:twelve_days_late, :space, champion: :champion, reviewer: :reviewer)
  #   |> Factory.add_goal(:fifteen_days_late, :space, champion: :champion, reviewer: :reviewer)
  #   |> Factory.add_goal(:twenty_days_late, :space, champion: :champion, reviewer: :reviewer)
  #   |> Factory.set_goal_next_update_date(:twelve_days_late, past_date(12))
  #   |> Factory.set_goal_next_update_date(:fifteen_days_late, past_date(15))
  #   |> Factory.set_goal_next_update_date(:twenty_days_late, past_date(20))
  # end

  # #
  # # Helpers
  # #

  # defp set_late_projects(ctx) do
  #   Enum.reduce([:late_project1, :late_project2], ctx, fn key, ctx ->
  #     {:ok, late_project} =
  #       ctx[key]
  #       |> Operately.Projects.Project.changeset(%{next_check_in_scheduled_at: past_date()})
  #       |> Repo.update()

  #     Map.put(ctx, key, late_project)
  #   end)
  # end

  defp set_next_check_in_date(ctx, key, date) do
    {:ok, project} =
      Operately.Projects.Project.changeset(ctx[key], %{
        next_check_in_scheduled_at: Operately.Time.as_datetime(date)
      })
      |> Repo.update()

    Map.put(ctx, key, project)
  end

  defp acknowledge_check_ins(ctx, check_in_key, person_key) do
    {:ok, check_in} =
      ctx[key]
      |> Operately.Projects.CheckIn.changeset(%{
        acknowledged_by_id: ctx[person].id,
        acknowledged_at: NaiveDateTime.utc_now()
      })
      |> Repo.update()

    Map.put(ctx, key, check_in)
  end

  # defp set_update_schedule(ctx, goal_key, date) do
  #   {:ok, goal} =
  #     Operately.Goals.Goal.changeset(ctx[goal_key], %{
  #       next_update_scheduled_at: date
  #     })
  #     |> Repo.update()

  #   Map.put(ctx, goal_key, goal)
  # end

  # defp acknowledge_updates(ctx) do
  #   Enum.reduce([:update1, :update2], ctx, fn key, ctx ->
  #     {:ok, update} =
  #       ctx[key]
  #       |> Operately.Goals.Update.changeset(%{
  #         acknowledged_at: DateTime.utc_now(),
  #         acknowledged_by_id: ctx.reviewer.id
  #       })
  #       |> Repo.update()

  #     Map.put(ctx, key, update)
  #   end)
  # end

  # defp create_late_check_in(ctx, key, days_late: days_late) do
  #   ctx = Factory.add_project_check_in(ctx, key, :project, :champion)
  #   date = past_date(days_late)

  #   {1, nil} =
  #     from(c in Operately.Projects.CheckIn, where: c.id == ^ctx[key].id)
  #     |> Repo.update_all(set: [inserted_at: date])

  #   check_in = Repo.reload(ctx[key])
  #   Map.put(ctx, key, check_in)
  # end

  # defp create_late_update(ctx, key, days_late: days_late) do
  #   ctx = Factory.add_goal_update(ctx, key, :goal, :champion)
  #   date = past_date(days_late)

  #   {1, nil} =
  #     from(u in Operately.Goals.Update, where: u.id == ^ctx[key].id)
  #     |> Repo.update_all(set: [inserted_at: date])

  #   update = Repo.reload(ctx[key])
  #   Map.put(ctx, key, update)
  # end

  # defp past_date(num \\ 2) do
  #   day_of_week = Date.utc_today() |> Date.day_of_week()

  #   extra_days =
  #     cond do
  #       day_of_week == 6 -> 1
  #       day_of_week == 7 -> 1
  #       true -> 0
  #     end

  #   Date.utc_today()
  #   |> subtract_days(num + extra_days)
  #   |> Operately.Time.as_datetime()
  # end

  # def subtract_days(date, 0), do: date

  # def subtract_days(date, days) do
  #   prev_date = Date.add(date, -1)

  #   if Date.day_of_week(prev_date) in [6, 7] do
  #     subtract_days(prev_date, days)
  #   else
  #     subtract_days(prev_date, days - 1)
  #   end
  # end

  def days_ago(num), do: Date.utc_today() |> Date.add(-num)
  def days_from_now(num), do: Date.utc_today() |> Date.add(num)
  def today(), do: Date.utc_today()
end
