defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateReviewerTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.UpdateReviewer
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a goal reviewer" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{success: true}} =
             UpdateReviewer.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "reviewer_id" => Paths.person_id(ctx.coworker)
             })

    assert ToolConnHelper.reload(ctx.goal).reviewer_id == ctx.coworker.id
  end

  test "call/2 clears the goal reviewer when reviewer_id is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, reviewer: :coworker)

    assert ctx.goal.reviewer_id == ctx.coworker.id

    assert {:ok, %{success: true}} =
             UpdateReviewer.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal)
             })

    assert is_nil(ToolConnHelper.reload(ctx.goal).reviewer_id)
  end
end
