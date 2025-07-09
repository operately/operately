defmodule Operately.AI.ToolsTest do
  use Operately.DataCase

  alias Operately.AI.Tools
  alias Operately.Support.Factory

  setup do
    Factory.setup(%{})
    |> Factory.add_space(:product)
  end

  describe "get_goal_details/0" do
    setup ctx do
      Factory.add_goal(ctx, :goal, :product)
    end

    test "returns goal details", ctx do
      tool = Tools.get_goal_details()
      context = %{person: ctx.creator, goal: ctx.goal}

      assert {:ok, result} = tool.function.(%{}, context)
      assert goal = Jason.decode!(result)
      assert goal["goal"]["name"] == ctx.goal.name
    end
  end
end
