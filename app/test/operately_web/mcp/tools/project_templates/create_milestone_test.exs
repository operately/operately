defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateMilestoneTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.Milestone
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateMilestone
  alias OperatelyWeb.Paths

  test "call/2 creates a milestone on a template" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)

    assert {:ok, %{milestone: milestone}} =
             CreateMilestone.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "title" => "New milestone",
               "description" => "Milestone **details**",
               "due_offset_days" => 25
             })

    db_milestone =
      milestone.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(Milestone, &1))

    assert db_milestone.title == "New milestone"
    assert db_milestone.due_offset_days == 25
  end
end
