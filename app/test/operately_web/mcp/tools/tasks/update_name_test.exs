defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateNameTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Tasks.UpdateName
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 renames a task" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    assert {:ok, %{task: task}} =
             UpdateName.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task),
               "name" => "Renamed Project MCP Task"
             })

    assert task.name == "Renamed Project MCP Task"
    assert ToolConnHelper.reload(ctx.task).name == "Renamed Project MCP Task"
  end
end
