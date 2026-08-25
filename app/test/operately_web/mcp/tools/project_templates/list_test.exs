defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.ListTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.List
  alias OperatelyWeb.Paths

  test "call/2 lists active project templates" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)

    assert {:ok, %{templates: templates}} =
             List.call(ToolConnHelper.conn(ctx), %{"archive_status" => "active"})

    assert Enum.any?(templates, &(&1.id == Paths.project_template_id(ctx.template)))
    assert Enum.any?(templates, &(&1.name == "Launch template"))
  end
end
