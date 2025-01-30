defmodule Operately.Assignments.LoaderTest do
  use Operately.DataCase

  alias Operately.Assignments.Loader

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
      assignments = Loader.load(ctx.champion)

      assert Enum.find(assignments, &(&1.id == ctx.due_project1.id))
      assert Enum.find(assignments, &(&1.id == ctx.due_project2.id))

      refute Enum.find(assignments, &(&1.id == ctx.project1.id))
      refute Enum.find(assignments, &(&1.id == ctx.project2.id))
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
      assignments = Loader.load(ctx.reviewer)

      assert Enum.find(assignments, &(&1.id == ctx.due_check_in1.id))
      assert Enum.find(assignments, &(&1.id == ctx.due_check_in2.id))

      refute Enum.find(assignments, &(&1.id == ctx.check_in1.id))
      refute Enum.find(assignments, &(&1.id == ctx.check_in2.id))
    end
  end

  describe "project milestones" do
    setup ctx do
      ctx
      |> Factory.add_project(:project, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.add_project_milestone(:due_milestone1, :project)
      |> Factory.add_project_milestone(:due_milestone2, :project)
      |> Factory.add_project_milestone(:milestone1, :project)
      |> Factory.add_project_milestone(:milestone2, :project)
      |> complete_milestones()
    end

    test "returns all due milestones", ctx do
      assignments = Loader.load(ctx.champion)

      assert Enum.find(assignments, &(&1.id == ctx.due_milestone1.id))
      assert Enum.find(assignments, &(&1.id == ctx.due_milestone2.id))

      refute Enum.find(assignments, &(&1.id == ctx.milestone1.id))
      refute Enum.find(assignments, &(&1.id == ctx.milestone2.id))
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
      assignments = Loader.load(ctx.champion)

      assert Enum.find(assignments, &(&1.id == ctx.due_goal1.id))
      assert Enum.find(assignments, &(&1.id == ctx.due_goal2.id))

      refute Enum.find(assignments, &(&1.id == ctx.goal1.id))
      refute Enum.find(assignments, &(&1.id == ctx.goal2.id))
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
      assignments = Loader.load(ctx.reviewer)

      assert Enum.find(assignments, &(&1.id == ctx.due_update1.id))
      assert Enum.find(assignments, &(&1.id == ctx.due_update2.id))

      refute Enum.find(assignments, &(&1.id == ctx.update1.id))
      refute Enum.find(assignments, &(&1.id == ctx.update2.id))
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

  defp complete_milestones(ctx) do
    Enum.reduce([:milestone1, :milestone2], ctx, fn key, ctx ->
      {:ok, milestone} =
        ctx[key]
        |> Operately.Projects.Milestone.changeset(%{
          status: :done,
          completed_at: NaiveDateTime.utc_now(),
        })
        |> Repo.update()
      Map.put(ctx, key, milestone)
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
