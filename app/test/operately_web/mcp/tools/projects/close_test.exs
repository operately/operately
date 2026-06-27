defmodule OperatelyWeb.Mcp.Tools.Projects.CloseTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.Close
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 closes a project and creates a retrospective" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{retrospective: retrospective}} =
             Close.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "success_status" => "achieved",
               "retrospective" => "Project shipped successfully"
             })

    assert retrospective.id
    assert ToolConnHelper.reload(ctx.project).status == "closed"
  end

  test "call/2 returns invalid_arguments for an unsupported success_status" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:error, :invalid_arguments} =
             Close.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "success_status" => "partial",
               "retrospective" => "Project shipped successfully"
             })
  end
end
