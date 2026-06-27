defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateDueDateTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.UpdateDueDate
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a project due date" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{success: true}} =
             UpdateDueDate.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "due_date" => "2026-08-01"
             })

    assert ToolConnHelper.reload(ctx.project).timeframe.contextual_end_date.date == ~D[2026-08-01]
  end

  test "call/2 clears the project due date when due_date is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{success: true}} =
             UpdateDueDate.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "due_date" => "2026-08-01"
             })

    assert ToolConnHelper.reload(ctx.project).timeframe.contextual_end_date.date == ~D[2026-08-01]

    assert {:ok, %{success: true}} =
             UpdateDueDate.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project)
             })

    assert ToolConnHelper.reload(ctx.project).timeframe.contextual_end_date == nil
  end
end
