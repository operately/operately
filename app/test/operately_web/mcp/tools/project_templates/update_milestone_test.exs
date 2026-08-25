defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateMilestoneTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.Milestone
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateMilestone
  alias OperatelyWeb.Paths

  test "call/2 updates a template milestone and clears due offset" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_milestone(:milestone, :template, due_offset_days: 10)

    assert {:ok, %{milestone: milestone}} =
             UpdateMilestone.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "milestone_id" => Paths.project_template_milestone_id(ctx.milestone),
               "title" => "Updated milestone",
               "due_offset_days" => nil
             })

    db_milestone = Operately.Repo.get!(Milestone, ctx.milestone.id)

    assert milestone.title == "Updated milestone"
    assert db_milestone.title == "Updated milestone"
    assert db_milestone.due_offset_days == nil
  end
end
