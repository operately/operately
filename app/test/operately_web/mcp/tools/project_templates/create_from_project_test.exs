defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateFromProjectTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.ProjectTemplate
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateFromProject
  alias OperatelyWeb.Paths

  test "call/2 creates a template from an existing project" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project(:source_project, :space)

    assert {:ok, %{template: template, schedule_issues: schedule_issues}} =
             CreateFromProject.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.source_project),
               "name" => "Saved project",
               "include_contributors_and_assignments" => false,
               "include_discussions" => false,
               "include_docs_and_files" => false,
               "include_comments" => false
             })

    db_template =
      template.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(ProjectTemplate, &1))

    assert db_template.name == "Saved project"
    assert db_template.source_project_id == ctx.source_project.id
    assert is_list(schedule_issues)
  end
end
