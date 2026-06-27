defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateStartDateTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.UpdateStartDate
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a project start date" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{success: true}} =
             UpdateStartDate.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "start_date" => "2026-07-01"
             })

    assert ToolConnHelper.reload(ctx.project).timeframe.contextual_start_date.date == ~D[2026-07-01]
  end

  test "call/2 clears the project start date when start_date is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{success: true}} =
             UpdateStartDate.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "start_date" => "2026-07-01"
             })

    assert ToolConnHelper.reload(ctx.project).timeframe.contextual_start_date.date == ~D[2026-07-01]

    assert {:ok, %{success: true}} =
             UpdateStartDate.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project)
             })

    assert ToolConnHelper.reload(ctx.project).timeframe.contextual_start_date == nil
  end
end
