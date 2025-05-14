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

      assert Goal.status(ctx.goal) == "achieved"
    end

    test "a closed goal with success 'no' should have status 'missed'", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:goal, :space)
        |> Factory.close_goal(:goal, success: "no")

      assert Goal.status(ctx.goal) == "missed"
    end

    @status [:pending, :on_track, :concern, :issue]

    tabletest @status do
      test "given a goal's last update is #{@test}, its status should also be #{@test}", ctx do
        ctx =
          ctx
          |> Factory.add_goal(:goal, :space)
          |> Factory.add_goal_update(:update, :goal, :creator, status: @test)
          |> Factory.reload(:goal)

        assert Goal.status(ctx.goal) == Atom.to_string(@test)
      end
    end

    test "a goal without update should be 'on_track'", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:goal, :space)
        |> Factory.preload(:goal, :last_update)

      assert Goal.status(ctx.goal) == "on_track"
    end
  end
end
