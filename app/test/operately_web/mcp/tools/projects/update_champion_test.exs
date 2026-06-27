defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateChampionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.UpdateChampion
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a project champion" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{success: true}} =
             UpdateChampion.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "champion_id" => Paths.person_id(ctx.coworker)
             })

    assert ToolConnHelper.reload(ctx.project, :champion).champion.id == ctx.coworker.id
  end

  test "call/2 clears the project champion when champion_id is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space, champion: :coworker)

    assert ToolConnHelper.reload(ctx.project, :champion).champion.id == ctx.coworker.id

    assert {:ok, %{success: true}} =
             UpdateChampion.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project)
             })

    assert ToolConnHelper.reload(ctx.project, :champion).champion == nil
  end
end
