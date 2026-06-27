defmodule OperatelyWeb.Mcp.Tools.Milestones.CompleteTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Milestones.Complete
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 completes a milestone" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)

    assert {:ok, %{comment: comment}} =
             Complete.call(ToolConnHelper.conn(ctx), %{
               "milestone_id" => Paths.milestone_id(ctx.milestone)
             })

    assert get_in(comment, [:comment, :id])
    assert ToolConnHelper.reload(ctx.milestone).status == :done
  end
end
