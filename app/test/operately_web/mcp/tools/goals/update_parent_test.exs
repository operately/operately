defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateParentTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias Operately.Access.Binding
  alias OperatelyWeb.Mcp.Tools.Goals.UpdateParent
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "rejects a foreign destination" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space)
    foreign = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space)
    activities = Repo.aggregate(Operately.Activities.Activity, :count)

    assert {:error, :not_found} = UpdateParent.call(ToolConnHelper.conn(ctx), %{"goal_id" => Paths.goal_id(ctx.goal), "parent_goal_id" => Paths.goal_id(foreign.goal)})
    assert ToolConnHelper.reload(ctx.goal).parent_goal_id == nil
    assert Repo.aggregate(Operately.Activities.Activity, :count) == activities
  end

  test "call/2 connects a goal to a parent goal" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal(:parent_goal, :space)

    assert {:ok, %{success: true}} =
             UpdateParent.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "parent_goal_id" => Paths.goal_id(ctx.parent_goal)
             })

    assert ToolConnHelper.reload(ctx.goal).parent_goal_id == ctx.parent_goal.id
  end

  test "call/2 allows a caller with edit access to change the parent" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:editor)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, company_access: Binding.edit_access())
      |> Factory.add_goal(:parent_goal, :space, company_access: Binding.view_access())

    assert {:ok, %{success: true}} =
             UpdateParent.call(ToolConnHelper.conn_as(ctx, :editor), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "parent_goal_id" => Paths.goal_id(ctx.parent_goal)
             })

    assert ToolConnHelper.reload(ctx.goal).parent_goal_id == ctx.parent_goal.id
  end

  test "call/2 clears the goal parent when parent_goal_id is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:parent_goal, :space)
      |> Factory.add_goal(:goal, :space, parent_goal: :parent_goal)

    assert ctx.goal.parent_goal_id == ctx.parent_goal.id

    assert {:ok, %{success: true}} =
             UpdateParent.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal)
             })

    assert is_nil(ToolConnHelper.reload(ctx.goal).parent_goal_id)
  end
end
