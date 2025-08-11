defmodule Operately.Goals.GoalTest do
  use Operately.DataCase
  alias Operately.Goals.Goal

  describe ".status" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
    end

    test "a closed goal with success 'yes' should have status 'achieved'", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:goal, :space)
        |> Factory.close_goal(:goal, success: "yes")
        |> Factory.preload(:goal, :last_update)

      assert Goal.status(ctx.goal) == :achieved
    end

    test "a closed goal with success 'no' should have status 'missed'", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:goal, :space)
        |> Factory.close_goal(:goal, success: "no", success_status: "missed")

      assert Goal.status(ctx.goal) == :missed
    end

    @status [:on_track, :caution, :off_track]

    tabletest @status do
      test "given a goal's last update is #{@test}, its status should also be #{@test}", ctx do
        ctx =
          ctx
          |> Factory.add_goal(:goal, :space)
          |> Factory.add_goal_update(:update, :goal, :creator, status: @test)
          |> Factory.reload(:goal)

        assert Goal.status(ctx.goal) == @test
      end
    end

    test "a goal which is not outdated and without update should be 'pending'", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:goal, :space)
        |> Factory.preload(:goal, :last_update)

      assert Goal.status(ctx.goal) == :pending
    end
  end

  describe ".search_potential_parent_goals" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal(:parent1, :space, name: "Parent option 1")
      |> Factory.add_goal(:parent2, :space, name: "Parent option 2")
      |> Factory.add_goal(:child_goal, :space, name: "child Goal")
      |> Factory.add_goal(:grandchild_goal, :space, name: "grandchild Goal")
      |> then(fn ctx ->
        Operately.Goals.update_goal(ctx.child_goal, %{parent_goal_id: ctx.goal.id})
        Operately.Goals.update_goal(ctx.grandchild_goal, %{parent_goal_id: ctx.child_goal.id})
        ctx
      end)
    end

    test "should return goals that are potential parents", ctx do
      results = Goal.search_potential_parent_goals(ctx.goal, ctx.creator, "parent")

      assert length(results) == 2
      assert Enum.at(results, 0).name == "Parent option 1"
      assert Enum.at(results, 1).name == "Parent option 2"
    end

    test "should not return child goals as potential parents", ctx do
      results = Goal.search_potential_parent_goals(ctx.goal, ctx.creator, "child")
      assert length(results) == 0
    end
  end

  describe ".progress_percentage" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])
    end

    test "fails if targets are not loaded", ctx do
      goal = Operately.Repo.preload(ctx.goal, [:checks])

      assert_raise RuntimeError, "Targets not loaded. Preload the targets before calling", fn ->
        Goal.progress_percentage(goal)
      end
    end

    test "fails if checks are not loaded", ctx do
      goal = Operately.Repo.preload(ctx.goal, [:targets])

      assert_raise RuntimeError, "Checks not loaded. Preload the checks before calling", fn ->
        Goal.progress_percentage(goal)
      end
    end

    test "when no targets, nor checks, return 0", ctx do
      goal = Operately.Repo.preload(ctx.goal, [:targets, :checks])
      assert Goal.progress_percentage(goal) == 0
    end

    test "calculate progress with only targets", ctx do
      ctx =
        ctx
        |> Factory.add_goal_target(:target1, :goal, name: "Target 1", from: 0, to: 100, value: 50)
        |> Factory.add_goal_target(:target2, :goal, name: "Target 2", from: 0, to: 200, value: 100)

      goal = Operately.Repo.preload(ctx.goal, [:targets, :checks])
      assert Goal.progress_percentage(goal) == 50.0
    end

    test "calculate progress with only checks", ctx do
      ctx =
        ctx
        |> Factory.add_goal_check(:check1, :goal, completed: true)
        |> Factory.add_goal_check(:check2, :goal, completed: false)

      goal = Operately.Repo.preload(ctx.goal, [:targets, :checks])
      assert Goal.progress_percentage(goal) == 50.0
    end

    test "calculate progress", ctx do
      ctx =
        ctx
        |> Factory.add_goal_target(:target1, :goal, name: "Target 1", from: 0, to: 100, value: 0)
        |> Factory.add_goal_target(:target2, :goal, name: "Target 2", from: 0, to: 200, value: 200)
        |> Factory.add_goal_target(:target3, :goal, name: "Target 3", from: 0, to: 300, value: 300)
        |> Factory.add_goal_check(:check1, :goal, completed: true)
        |> Factory.add_goal_check(:check2, :goal, completed: true)

      # logic:
      #
      # target1: 0%
      # target2: 100%
      # target3: 100%
      # checks: 100%
      #
      # checks are valued as one target that can range from 0-100

      goal = Operately.Repo.preload(ctx.goal, [:targets, :checks])
      assert Goal.progress_percentage(goal) == 75.0
    end
  end

  describe ".next_step" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])
    end

    test "fails if targets are not loaded", ctx do
      goal = Operately.Repo.preload(ctx.goal, [:checks])

      assert_raise RuntimeError, "Targets not loaded. Preload the targets before calling", fn ->
        Goal.next_step(goal)
      end
    end

    test "fails if checks are not loaded", ctx do
      goal = Operately.Repo.preload(ctx.goal, [:targets])

      assert_raise RuntimeError, "Checks not loaded. Preload the checks before calling", fn ->
        Goal.next_step(goal)
      end
    end

    test "returns empty string if all targets and checks are done", ctx do
      ctx =
        ctx
        |> Factory.add_goal_target(:target1, :goal, name: "Target 1", from: 0, to: 100, value: 100)
        |> Factory.add_goal_check(:check1, :goal, name: "Check 1", completed: true)

      goal = Operately.Repo.preload(ctx.goal, [:targets, :checks])
      assert Goal.next_step(goal) == ""
    end

    test "returns first pending target name if there are pending targets", ctx do
      ctx =
        ctx
        |> Factory.add_goal_target(:target1, :goal, name: "Target 1", from: 0, to: 100, value: 0, index: 1)
        |> Factory.add_goal_target(:target2, :goal, name: "Target 2", from: 0, to: 100, value: 100, index: 2)
        |> Factory.add_goal_check(:check1, :goal, name: "Check 1", completed: true)

      goal = Operately.Repo.preload(ctx.goal, [:targets, :checks])
      assert Goal.next_step(goal) == "Target 1"
    end

    test "returns first pending check name if all targets are done and there are pending checks", ctx do
      ctx =
        ctx
        |> Factory.add_goal_target(:target1, :goal, name: "Target 1", from: 0, to: 100, value: 100)
        |> Factory.add_goal_check(:check1, :goal, name: "Check 1", completed: false, index: 1)
        |> Factory.add_goal_check(:check2, :goal, name: "Check 2", completed: true, index: 2)

      goal = Operately.Repo.preload(ctx.goal, [:targets, :checks])
      assert Goal.next_step(goal) == "Check 1"
    end

    test "returns the first pending target name if both targets and checks are pending", ctx do
      ctx =
        ctx
        |> Factory.add_goal_target(:target1, :goal, name: "Target 1", from: 0, to: 100, value: 0, index: 1)
        |> Factory.add_goal_check(:check1, :goal, name: "Check 1", completed: false, index: 1)

      goal = Operately.Repo.preload(ctx.goal, [:targets, :checks])
      assert Goal.next_step(goal) == "Target 1"
    end

    test "returns the first pending target by index if multiple targets are pending", ctx do
      ctx =
        ctx
        |> Factory.add_goal_target(:target1, :goal, name: "Target 1", from: 0, to: 100, value: 0, index: 2)
        |> Factory.add_goal_target(:target2, :goal, name: "Target 2", from: 0, to: 100, value: 0, index: 1)
        |> Factory.add_goal_check(:check1, :goal, name: "Check 1", completed: true)

      goal = Operately.Repo.preload(ctx.goal, [:targets, :checks])
      assert Goal.next_step(goal) == "Target 2"
    end
  end
end
