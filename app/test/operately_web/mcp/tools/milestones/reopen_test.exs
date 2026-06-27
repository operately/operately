defmodule OperatelyWeb.Mcp.Tools.Milestones.ReopenTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Milestones.Reopen
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 reopens a completed milestone" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.close_project_milestone(:milestone)

    assert {:ok, %{comment: comment}} =
             Reopen.call(ToolConnHelper.conn(ctx), %{
               "milestone_id" => Paths.milestone_id(ctx.milestone)
             })

    assert get_in(comment, [:comment, :id])
    assert ToolConnHelper.reload(ctx.milestone).status == :pending
  end
end
