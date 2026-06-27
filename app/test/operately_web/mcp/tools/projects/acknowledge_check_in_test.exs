defmodule OperatelyWeb.Mcp.Tools.Projects.AcknowledgeCheckInTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.AcknowledgeCheckIn
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 acknowledges a project check-in" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_check_in(:check_in, :project, :creator)

    assert {:ok, %{check_in: check_in}} =
             AcknowledgeCheckIn.call(ToolConnHelper.conn_as(ctx, :coworker), %{
               "check_in_id" => Paths.project_check_in_id(ctx.check_in)
             })

    assert check_in.id == Paths.project_check_in_id(ctx.check_in)
  end
end
