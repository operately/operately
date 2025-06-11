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
        |> Factory.close_goal(:goal, success: "no")

      assert Goal.status(ctx.goal) == :missed
    end

    @status [:pending, :on_track, :concern, :issue]

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

    test "a goal without update should be 'on_track'", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:goal, :space)
        |> Factory.preload(:goal, :last_update)

      assert Goal.status(ctx.goal) == :on_track
    end
  end

  describe ".search_potential_parent_goals" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal(:parent1, :space, name: "parent option 1")
      |> Factory.add_goal(:parent2, :space, name: "parent option 2")
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
      assert Enum.at(results, 0).name == "parent option 1"
      assert Enum.at(results, 1).name == "parent option 2"
    end

    test "should not return child goals as potential parents", ctx do
      results = Goal.search_potential_parent_goals(ctx.goal, ctx.creator, "child")
      assert length(results) == 0
    end
  end
end
