defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateDescriptionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Tasks.UpdateDescription
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a task description" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    assert {:ok, %{task: task}} =
             UpdateDescription.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task),
               "description" => "Updated task description"
             })

    assert task.id == Paths.task_id(ctx.task)
    assert ToolConnHelper.reload(ctx.task) |> Map.get(:description) |> ToolConnHelper.rich_text_to_string() == "Updated task description"
  end

  test "call/2 clears the task description when description is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    assert {:ok, %{task: task}} =
             UpdateDescription.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task),
               "description" => "Initial task description"
             })

    assert task.id == Paths.task_id(ctx.task)
    assert ToolConnHelper.reload(ctx.task) |> Map.get(:description) |> ToolConnHelper.rich_text_to_string() == "Initial task description"

    assert {:ok, %{task: task}} =
             UpdateDescription.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task)
             })

    assert task.id == Paths.task_id(ctx.task)
    assert ToolConnHelper.reload(ctx.task).description == Operately.RichContent.Builder.empty_content()
  end
end
