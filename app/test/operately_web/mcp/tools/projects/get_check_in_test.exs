defmodule OperatelyWeb.Mcp.Tools.Projects.GetCheckInTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Projects.GetCheckIn
  alias OperatelyWeb.Paths

  test "call/2 returns one check-in with comments" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_check_in(:check_in, :project, :creator)
      |> Factory.preload(:check_in, :project)
      |> Factory.add_comment(:check_in_comment, :check_in)

    conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

    assert {:ok, %{check_in: check_in}} = GetCheckIn.call(conn, %{"check_in_id" => Paths.project_check_in_id(ctx.check_in)})
    assert check_in.id == Paths.project_check_in_id(ctx.check_in)
    assert length(check_in.comments) == 1
  end
end
