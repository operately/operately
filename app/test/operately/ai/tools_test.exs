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

  describe "post_goal_message/0" do
    setup ctx do
      Factory.add_goal(ctx, :goal, :product)
    end

    test "posts a message to the goal", ctx do
      tool = Tools.post_goal_message()
      context = %{person: ctx.creator, goal: ctx.goal}
      args = %{"title" => "Test Message", "message" => "This is a test message."}

      assert {:ok, result} = tool.function.(args, context)
      assert message = Jason.decode!(result)
      assert message["message"]["title"] == "Test Message"
      assert message["message"]["body"] == "This is a test message."
    end
  end
end
