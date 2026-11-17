defmodule OperatelyWeb.Mcp.Tools.People.ListMyTasksTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.People.ListMyTasks
  alias OperatelyWeb.Paths

  test "returns open tasks assigned to the authenticated person" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone, name: "Ship the launch")
      |> Factory.add_task_assignee(:assignee, :task, :creator)
      |> Factory.add_company_member(:coworker)
      |> Factory.add_project_task(:other_task, :milestone, name: "Coworker task")
      |> Factory.add_task_assignee(:other_assignee, :other_task, :coworker)

    assert {:ok, %{tasks: tasks}} = ListMyTasks.call(ToolConnHelper.conn(ctx), %{})

    assert Enum.map(tasks, & &1.id) == [Paths.task_id(ctx.task)]
    assert hd(tasks).name == "Ship the launch"
    refute Enum.any?(tasks, &(&1.id == Paths.task_id(ctx.other_task)))
  end
end
