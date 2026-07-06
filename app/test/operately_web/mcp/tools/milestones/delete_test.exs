defmodule OperatelyWeb.Mcp.Tools.Milestones.DeleteTest do
  use Operately.DataCase, async: true

  alias Operately.Projects.Milestone
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Milestones.Delete
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 deletes a milestone" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)

    assert {:ok, %{success: true}} =
             Delete.call(ToolConnHelper.conn(ctx), %{
               "milestone_id" => Paths.milestone_id(ctx.milestone)
             })

    refute Operately.Repo.get(Milestone, ctx.milestone.id)
  end

  test "returns invalid_arguments for a malformed milestone id" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} =
             Delete.call(ToolConnHelper.conn(ctx), %{
               "milestone_id" => "definitely-not-a-valid-operately-id-%%%"
             })
  end
end
