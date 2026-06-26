defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateDueDateTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Tasks.UpdateDueDate
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a task due date" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    assert {:ok, %{task: task}} =
             UpdateDueDate.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task),
               "due_date" => "2026-09-10"
             })

    assert task.id == Paths.task_id(ctx.task)
    assert ToolConnHelper.reload(ctx.task).due_date.date == ~D[2026-09-10]
  end

  test "call/2 clears the task due date when due_date is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    assert {:ok, %{task: task}} =
             UpdateDueDate.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task),
               "due_date" => "2026-09-10"
             })

    assert task.id == Paths.task_id(ctx.task)
    assert ToolConnHelper.reload(ctx.task).due_date.date == ~D[2026-09-10]

    assert {:ok, %{task: task}} =
             UpdateDueDate.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task)
             })

    assert task.id == Paths.task_id(ctx.task)
    assert is_nil(ToolConnHelper.reload(ctx.task).due_date)
  end
end
