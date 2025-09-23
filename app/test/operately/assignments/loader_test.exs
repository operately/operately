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

      assignments = Loader.load(ctx.reviewer, ctx.company)

      assert length(assignments) == 1
      assert Enum.at(assignments, 0).resource_id == Paths.project_check_in_id(ctx.check_in)
    end

    test "when the check-in is acknowledged, does not return as assignment", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)
      ctx = Factory.add_project_check_in(ctx, :check_in, :project, :champion)

      acknowledge_check_in(ctx, :check_in, :reviewer)

      assignments = Loader.load(ctx.champion, ctx.company)
      assert length(assignments) == 0
    end

    test "when the reviewer checked-in, the champion gets an assignment", ctx do
      ctx = Factory.add_project(ctx, :project, :space, champion: :champion, reviewer: :reviewer)
      ctx = Factory.add_project_check_in(ctx, :check_in, :project, :reviewer)

      assignments = Loader.load(ctx.champion, ctx.company)
      assert length(assignments) == 1
      assert Enum.at(assignments, 0).resource_id == Paths.project_check_in_id(ctx.check_in)

      assignments = Loader.load(ctx.reviewer, ctx.company)
      assert length(assignments) == 0
    end
  end

  describe "goal updates" do
    test "when there's an unacknowledged goal update, returns as assignment", ctx do
      ctx = Factory.add_goal(ctx, :goal, :space, champion: :champion, reviewer: :reviewer)
      ctx = Factory.add_goal_update(ctx, :update, :goal, :champion)

      assignments = Loader.load(ctx.reviewer, ctx.company)

      assert length(assignments) == 1
      assert Enum.at(assignments, 0).resource_id == Paths.goal_update_id(ctx.update)
    end

    test "when the goal update is acknowledged, does not return as assignment", ctx do
      ctx = Factory.add_goal(ctx, :goal, :space, champion: :champion, reviewer: :reviewer)
      ctx = Factory.add_goal_update(ctx, :update, :goal, :champion)

      acknowledge_goal_update(ctx, :update, :reviewer)

      assignments = Loader.load(ctx.reviewer, ctx.company)
      assert length(assignments) == 0
    end

    test "when the reviewer creates a goal update, the champion gets an assignment", ctx do
      ctx = Factory.add_goal(ctx, :goal, :space, champion: :champion, reviewer: :reviewer)
      ctx = Factory.add_goal_update(ctx, :update, :goal, :reviewer)

      assignments = Loader.load(ctx.champion, ctx.company)
      assert length(assignments) == 1
      assert Enum.at(assignments, 0).resource_id == Paths.goal_update_id(ctx.update)

      assignments = Loader.load(ctx.reviewer, ctx.company)
      assert length(assignments) == 0
    end
  end

  describe "goal check-ins" do
    test "when the next goal update date is in the past, returns as assignment", ctx do
      ctx = Factory.add_goal(ctx, :goal, :space, champion: :champion, reviewer: :reviewer)

      set_next_goal_update_date(ctx, :goal, days_ago(3))

      assignments = Loader.load(ctx.champion, ctx.company)

      assert length(assignments) == 1
      assert Enum.at(assignments, 0).resource_id == Paths.goal_id(ctx.goal)
    end

    test "when the next goal update date is today, returns as assignment", ctx do
      ctx = Factory.add_goal(ctx, :goal, :space, champion: :champion, reviewer: :reviewer)

      set_next_goal_update_date(ctx, :goal, today())

      assignments = Loader.load(ctx.champion, ctx.company)

      assert length(assignments) == 1
      assert Enum.at(assignments, 0).resource_id == Paths.goal_id(ctx.goal)
    end

    test "when the next goal update date is in the future, does not return as assignment", ctx do
      ctx = Factory.add_goal(ctx, :goal, :space, champion: :champion, reviewer: :reviewer)

      set_next_goal_update_date(ctx, :goal, days_from_now(3))

      assignments = Loader.load(ctx.champion, ctx.company)
      assert length(assignments) == 0
    end
  end

  # Helper functions
  defp acknowledge_goal_update(ctx, update_key, person_key) do
    {:ok, update} =
      ctx[update_key]
      |> Operately.Goals.Update.changeset(%{
        acknowledged_by_id: ctx[person_key].id,
        acknowledged_at: NaiveDateTime.utc_now()
      })
      |> Repo.update()

    Map.put(ctx, update_key, update)
  end

  defp set_next_goal_update_date(ctx, key, date) do
    {:ok, goal} =
      Operately.Goals.Goal.changeset(ctx[key], %{
        next_update_scheduled_at: Operately.Time.as_datetime(date)
      })
      |> Repo.update()

    Map.put(ctx, key, goal)
  end

  defp set_next_check_in_date(ctx, key, date) do
    {:ok, project} =
      Operately.Projects.Project.changeset(ctx[key], %{
        next_check_in_scheduled_at: Operately.Time.as_datetime(date)
      })
      |> Repo.update()

    Map.put(ctx, key, project)
  end

  defp acknowledge_check_in(ctx, check_in_key, person_key) do
    {:ok, check_in} =
      ctx[check_in_key]
      |> Operately.Projects.CheckIn.changeset(%{
        acknowledged_by_id: ctx[person_key].id,
        acknowledged_at: NaiveDateTime.utc_now()
      })
      |> Repo.update()

    Map.put(ctx, check_in_key, check_in)
  end

  def days_ago(num), do: Date.utc_today() |> Date.add(-num)
  def days_from_now(num), do: Date.utc_today() |> Date.add(num)
  def today(), do: Date.utc_today()
end
