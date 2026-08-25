defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.DeleteMilestoneTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.Milestone
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.DeleteMilestone
  alias OperatelyWeb.Paths

  test "call/2 deletes a template milestone" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_milestone(:milestone, :template, due_offset_days: 10)

    assert {:ok, %{success: true}} =
             DeleteMilestone.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "milestone_id" => Paths.project_template_milestone_id(ctx.milestone)
             })

    refute Operately.Repo.get(Milestone, ctx.milestone.id)
  end
end
