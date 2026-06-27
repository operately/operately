defmodule OperatelyWeb.Mcp.Tools.Projects.PauseTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.Pause
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 pauses a project" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{project: project}} =
             Pause.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project)
             })

    assert project.id == Paths.project_id(ctx.project)
    assert ToolConnHelper.reload(ctx.project).status == "paused"
  end
end
