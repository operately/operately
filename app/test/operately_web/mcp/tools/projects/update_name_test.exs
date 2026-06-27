defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateNameTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.UpdateName
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 renames a project" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{project: project}} =
             UpdateName.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "name" => "Renamed MCP Project"
             })

    assert project.name == "Renamed MCP Project"
    assert ToolConnHelper.reload(ctx.project).name == "Renamed MCP Project"
  end
end
