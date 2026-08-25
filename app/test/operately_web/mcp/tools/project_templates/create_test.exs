defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.ProjectTemplate
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.Create
  alias OperatelyWeb.Paths

  test "call/2 creates a project template in a space" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)

    assert {:ok, %{template: template}} =
             Create.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "New template",
               "description" => "Reusable **plan**",
               "duration_days" => 14
             })

    db_template =
      template.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(ProjectTemplate, &1))

    assert db_template.name == "New template"
    assert db_template.duration_days == 14
    assert db_template.space_id == ctx.space.id
  end
end
