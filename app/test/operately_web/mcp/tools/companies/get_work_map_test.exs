defmodule OperatelyWeb.Mcp.Tools.Companies.GetWorkMapTest do
  use Operately.DataCase

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Companies.GetWorkMap, as: Tool
  alias OperatelyWeb.Paths

  test "a space map can include the accessible parent of a completed project" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:product)
      |> Factory.add_space(:company_goals)
      |> Factory.add_goal(:goal, :company_goals)
      |> Factory.add_project(:project, :product, goal: :goal)
      |> Factory.close_project(:project)

    args = %{"space_id" => Paths.space_id(ctx.product), "include_cross_space_parents" => true}
    assert {:ok, %{work_map: [%{id: goal, children: [%{id: project}]}]}} = Tool.call(ToolConnHelper.conn(ctx), args)
    assert goal == Paths.goal_id(ctx.goal)
    assert project == Paths.project_id(ctx.project)
  end

  test "returns accessible work and respects resource filters" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
    ctx = Factory.add_project_task(ctx, :task, nil, project_id: ctx.project.id)
    args = %{"space_id" => Paths.space_id(ctx.space), "include_assignees" => true, "include_reviewer" => true}
    assert {:ok, %{work_map: items}} = Tool.call(ToolConnHelper.conn(ctx), args)
    assert Enum.any?(items, &(&1.id == Paths.project_id(ctx.project)))
    project = Enum.find(items, &(&1.id == Paths.project_id(ctx.project)))
    assert project.task_completion == %{completed_count: 0, total_count: 1, percentage: 0}
    assert {:ok, %{work_map: []}} = Tool.call(ToolConnHelper.conn(Factory.setup(%{})), args)
    assert {:error, :invalid_arguments} = Tool.call(ToolConnHelper.conn(ctx), %{"space_id" => "invalid-%%"})
  end
end
