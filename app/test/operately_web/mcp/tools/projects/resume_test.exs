defmodule OperatelyWeb.Mcp.Tools.Projects.ResumeTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.Resume
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 resumes a paused project" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.pause_project(:project)

    assert {:ok, %{project: project}} =
             Resume.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "message" => "Project can resume now"
             })

    assert project.id == Paths.project_id(ctx.project)
    assert ToolConnHelper.reload(ctx.project).status == "active"
  end
end
