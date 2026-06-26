defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateDescriptionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.UpdateDescription
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a goal description" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{success: true}} =
             UpdateDescription.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "description" => "Updated goal description"
             })

    assert ToolConnHelper.reload(ctx.goal) |> Map.get(:description) |> ToolConnHelper.rich_text_to_string() == "Updated goal description"
  end

  test "call/2 clears the goal description when description is empty" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{success: true}} =
             UpdateDescription.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "description" => "Initial goal description"
             })

    assert {:ok, %{success: true}} =
             UpdateDescription.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "description" => ""
             })

    assert ToolConnHelper.reload(ctx.goal).description == Operately.RichContent.Builder.empty_content()
  end
end
