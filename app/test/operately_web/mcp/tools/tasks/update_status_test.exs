defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateStatusTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Tasks.UpdateStatus
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a task status" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    assert {:ok, %{task: task}} =
             UpdateStatus.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task),
               "status" => "done"
             })

    assert task.id == Paths.task_id(ctx.task)
    assert ToolConnHelper.reload(ctx.task).status == "done"
  end
end
