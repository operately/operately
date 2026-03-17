defmodule OperatelyWeb.Api.GoalDiscussions.ListTest do
  use OperatelyWeb.TurboCase

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  describe "list discussions" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:goal_discussions, :list], %{})
    end

    test "it requires a goal_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:goal_discussions, :list], %{})
      assert res.message == "Missing required fields: goal_id"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      goal_id = Ecto.UUID.generate() |> Paths.goal_id()
      assert {404, res} = query(ctx.conn, [:goal_discussions, :list], %{goal_id: goal_id})
      assert res.message == "Goal not found"
    end

    test "it returns discussions for the goal", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_goal_discussion(ctx, :discussion, :goal)

      assert {200, res} = query(ctx.conn, [:goal_discussions, :list], %{goal_id: Paths.goal_id(ctx.goal)})
      assert length(res.discussions) == 1
    end
  end
end
