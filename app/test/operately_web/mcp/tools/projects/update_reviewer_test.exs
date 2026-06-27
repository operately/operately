defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateReviewerTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.UpdateReviewer
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a project reviewer" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{success: true}} =
             UpdateReviewer.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "reviewer_id" => Paths.person_id(ctx.coworker)
             })

    assert ToolConnHelper.reload(ctx.project, :reviewer).reviewer.id == ctx.coworker.id
  end

  test "call/2 clears the project reviewer when reviewer_id is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space, reviewer: :coworker)

    assert ToolConnHelper.reload(ctx.project, :reviewer).reviewer.id == ctx.coworker.id

    assert {:ok, %{success: true}} =
             UpdateReviewer.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project)
             })

    assert ToolConnHelper.reload(ctx.project, :reviewer).reviewer == nil
  end
end
