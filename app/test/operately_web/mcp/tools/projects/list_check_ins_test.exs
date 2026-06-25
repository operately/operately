defmodule OperatelyWeb.Mcp.Tools.Projects.ListCheckInsTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Projects.ListCheckIns
  alias OperatelyWeb.Paths

  test "call/2 returns check-ins for one project" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_check_in(:check_in, :project, :creator)

    conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

    assert {:ok, %{check_ins: check_ins}} = ListCheckIns.call(conn, %{"project_id" => Paths.project_id(ctx.project)})
    assert Enum.map(check_ins, & &1.id) == [Paths.project_check_in_id(ctx.check_in)]
  end
end
