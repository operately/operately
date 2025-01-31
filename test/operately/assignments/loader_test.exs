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

  describe "projects" do
    setup ctx do
      ctx
      |> Factory.add_project(:due_project1, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.add_project(:due_project2, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.add_project(:project1, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.add_project(:project2, :space, champion: :champion, reviewer: :reviewer)
      |> set_due_projects()
    end

    test "returns all due projects", ctx do
      assignments = Loader.load(ctx.champion, ctx.company)

      assert Enum.find(assignments, &(&1.resource_id == Paths.project_id(ctx.due_project1)))
      assert Enum.find(assignments, &(&1.resource_id == Paths.project_id(ctx.due_project2)))

      refute Enum.find(assignments, &(&1.resource_id == Paths.project_id(ctx.project1)))
      refute Enum.find(assignments, &(&1.resource_id == Paths.project_id(ctx.project2)))
    end

    test "doesn't return due projects to non-champions", ctx do
      assignments = Loader.load(ctx.reviewer, ctx.company)

      refute Enum.find(assignments, &(&1.resource_id == Paths.project_id(ctx.due_project1)))
      refute Enum.find(assignments, &(&1.resource_id == Paths.project_id(ctx.due_project2)))
      refute Enum.find(assignments, &(&1.resource_id == Paths.project_id(ctx.project1)))
      refute Enum.find(assignments, &(&1.resource_id == Paths.project_id(ctx.project2)))
    end
  end

  describe "project check-ins" do
    setup ctx do
      ctx
      |> Factory.add_project(:project, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.add_project_check_in(:due_check_in1, :project, :champion)
      |> Factory.add_project_check_in(:due_check_in2, :project, :champion)
      |> Factory.add_project_check_in(:check_in1, :project, :champion)
      |> Factory.add_project_check_in(:check_in2, :project, :champion)
      |> acknowledge_check_ins()
    end

    test "returns all due check-ins", ctx do
      assignments = Loader.load(ctx.reviewer, ctx.company)

      assert Enum.find(assignments, &(&1.resource_id == Paths.project_check_in_id(ctx.due_check_in1)))
      assert Enum.find(assignments, &(&1.resource_id == Paths.project_check_in_id(ctx.due_check_in2)))

      refute Enum.find(assignments, &(&1.resource_id == Paths.project_check_in_id(ctx.check_in1)))
      refute Enum.find(assignments, &(&1.resource_id == Paths.project_check_in_id(ctx.check_in2)))
    end

    test "doesn't return due check-ins to non-reviewers", ctx do
      assignments = Loader.load(ctx.champion, ctx.company)

      refute Enum.find(assignments, &(&1.resource_id == Paths.project_check_in_id(ctx.due_check_in1)))
      refute Enum.find(assignments, &(&1.resource_id == Paths.project_check_in_id(ctx.due_check_in2)))
      refute Enum.find(assignments, &(&1.resource_id == Paths.project_check_in_id(ctx.check_in1)))
      refute Enum.find(assignments, &(&1.resource_id == Paths.project_check_in_id(ctx.check_in2)))
    end
  end

  describe "goals" do
    setup ctx do
      ctx
      |> Factory.add_goal(:due_goal1, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.add_goal(:due_goal2, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.add_goal(:goal1, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.add_goal(:goal2, :space, champion: :champion, reviewer: :reviewer)
      |> set_due_goals()
    end

    test "returns all due goals", ctx do
      assignments = Loader.load(ctx.champion, ctx.company)

      assert Enum.find(assignments, &(&1.resource_id == Paths.goal_id(ctx.due_goal1)))
      assert Enum.find(assignments, &(&1.resource_id == Paths.goal_id(ctx.due_goal2)))

      refute Enum.find(assignments, &(&1.resource_id == Paths.goal_id(ctx.goal1)))
      refute Enum.find(assignments, &(&1.resource_id == Paths.goal_id(ctx.goal2)))
    end

    test "doesn't return due goals to non-champions", ctx do
      assignments = Loader.load(ctx.reviewer, ctx.company)

      refute Enum.find(assignments, &(&1.resource_id == Paths.goal_id(ctx.due_goal1)))
      refute Enum.find(assignments, &(&1.resource_id == Paths.goal_id(ctx.due_goal2)))
      refute Enum.find(assignments, &(&1.resource_id == Paths.goal_id(ctx.goal1)))
      refute Enum.find(assignments, &(&1.resource_id == Paths.goal_id(ctx.goal2)))
    end
  end

  describe "goal updates" do
    setup ctx do
      ctx
      |> Factory.add_goal(:goal, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.add_goal_update(:due_update1, :goal, :champion)
      |> Factory.add_goal_update(:due_update2, :goal, :champion)
      |> Factory.add_goal_update(:update1, :goal, :champion)
      |> Factory.add_goal_update(:update2, :goal, :champion)
      |> acknowledge_updates()
    end

    test "returns all due updates", ctx do
      assignments = Loader.load(ctx.reviewer, ctx.company)

      assert Enum.find(assignments, &(&1.resource_id == Paths.goal_update_id(ctx.due_update1)))
      assert Enum.find(assignments, &(&1.resource_id == Paths.goal_update_id(ctx.due_update2)))

      refute Enum.find(assignments, &(&1.resource_id == Paths.goal_update_id(ctx.update1)))
      refute Enum.find(assignments, &(&1.resource_id == Paths.goal_update_id(ctx.update2)))
    end

    test "doesn't return due updates to non-reviewer", ctx do
      assignments = Loader.load(ctx.champion, ctx.company)

      refute Enum.find(assignments, &(&1.resource_id == Paths.goal_update_id(ctx.due_update1)))
      refute Enum.find(assignments, &(&1.resource_id == Paths.goal_update_id(ctx.due_update2)))
      refute Enum.find(assignments, &(&1.resource_id == Paths.goal_update_id(ctx.update1)))
      refute Enum.find(assignments, &(&1.resource_id == Paths.goal_update_id(ctx.update2)))
    end
  end

  #
  # Helpers
  #

  defp set_due_projects(ctx) do
    Enum.reduce([:due_project1, :due_project2], ctx, fn key, ctx ->
      {:ok, due_project} =
        ctx[key]
        |> Operately.Projects.Project.changeset(%{next_check_in_scheduled_at: past_date()})
        |> Repo.update()
      Map.put(ctx, key, due_project)
    end)
  end

  defp acknowledge_check_ins(ctx) do
    Enum.reduce([:check_in1, :check_in2], ctx, fn key, ctx ->
      {:ok, check_in} =
        ctx[key]
        |> Operately.Projects.CheckIn.changeset(%{
          acknowledged_by_id: ctx.reviewer.id,
          acknowledged_at: NaiveDateTime.utc_now(),
        })
        |> Repo.update()
      Map.put(ctx, key, check_in)
    end)
  end

  defp set_due_goals(ctx) do
    Enum.reduce([:due_goal1, :due_goal2], ctx, fn key, ctx ->
      {:ok, due_goal} =
        ctx[key]
        |> Operately.Goals.Goal.changeset(%{next_update_scheduled_at: past_date()})
        |> Repo.update()
      Map.put(ctx, key, due_goal)
    end)
  end

  defp acknowledge_updates(ctx) do
    Enum.reduce([:update1, :update2], ctx, fn key, ctx ->
      {:ok, update} =
        ctx[key]
        |> Operately.Goals.Update.changeset(%{
          acknowledged_at: DateTime.utc_now(),
          acknowledged_by_id: ctx.reviewer.id,
        })
        |> Repo.update()
      Map.put(ctx, key, update)
    end)
  end

  defp past_date do
    Date.utc_today()
    |> Date.add(-3)
    |> Operately.Time.as_datetime()
  end
end
