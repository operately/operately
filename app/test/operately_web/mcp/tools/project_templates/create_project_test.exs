defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateProjectTest do
  use Operately.DataCase, async: true

  alias Operately.Projects.Project
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateProject
  alias OperatelyWeb.Paths

  test "call/2 creates a project from a template" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)

    assert {:ok, %{project: project}} =
             CreateProject.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "space_id" => Paths.space_id(ctx.space),
               "start_date" => "2026-09-01",
               "name" => "Materialized project"
             })

    db_project =
      project.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(Project, &1))

    assert db_project.name == "Materialized project"
    assert db_project.source_template_id == ctx.template.id
    assert db_project.group_id == ctx.space.id
  end
end
