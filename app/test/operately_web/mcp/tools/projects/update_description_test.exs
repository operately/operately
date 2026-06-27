defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateDescriptionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.UpdateDescription
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a project description" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{project: project}} =
             UpdateDescription.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "description" => "Updated project description"
             })

    assert project.id == Paths.project_id(ctx.project)
    assert ToolConnHelper.reload(ctx.project) |> Map.get(:description) |> ToolConnHelper.rich_text_to_string() == "Updated project description"
  end

  test "call/2 clears the project description when description is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{project: project}} =
             UpdateDescription.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "description" => "Initial project description"
             })

    assert project.id == Paths.project_id(ctx.project)
    assert ToolConnHelper.reload(ctx.project) |> Map.get(:description) |> ToolConnHelper.rich_text_to_string() == "Initial project description"

    assert {:ok, %{project: project}} =
             UpdateDescription.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project)
             })

    assert project.id == Paths.project_id(ctx.project)
    assert ToolConnHelper.reload(ctx.project).description == Operately.RichContent.Builder.empty_content()
  end
end
