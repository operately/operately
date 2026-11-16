defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateNameTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.UpdateName
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "returns a validation error without renaming the project" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert UpdateName.definition().input_schema["properties"]["name"]["maxLength"] == 255

    assert {:error, :bad_request, message} =
             UpdateName.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "name" => String.duplicate("a", 256)
             })

    assert message =~ "255"
    assert ToolConnHelper.reload(ctx.project).name == ctx.project.name
  end

  test "call/2 renames a project" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{project: project}} =
             UpdateName.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "name" => "Renamed MCP Project"
             })

    assert project.name == "Renamed MCP Project"
    assert ToolConnHelper.reload(ctx.project).name == "Renamed MCP Project"
  end
end
