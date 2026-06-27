defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateGoalTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.UpdateGoal
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 connects a project to a goal" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{success: true}} =
             UpdateGoal.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "goal_id" => Paths.goal_id(ctx.goal)
             })

    assert ToolConnHelper.reload(ctx.project).goal_id == ctx.goal.id
  end

  test "call/2 clears the project goal when goal_id is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_project(:project, :space, goal: :goal)

    assert ToolConnHelper.reload(ctx.project).goal_id == ctx.goal.id

    assert {:ok, %{success: true}} =
             UpdateGoal.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project)
             })

    assert is_nil(ToolConnHelper.reload(ctx.project).goal_id)
  end
end
