defmodule OperatelyWeb.Mcp.Tools.Projects.CreateTest do
  use Operately.DataCase, async: true

  alias Operately.Projects.Project
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.Create
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 creates a project in a space" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)

    assert {:ok, %{project: project}} =
             Create.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Project",
               "description" => "Initial project description"
             })

    project = Operately.Repo.get!(Project, ToolConnHelper.decode_id!(project.id))

    assert project.name == "MCP Project"
    assert project.group_id == ctx.space.id
    assert ToolConnHelper.rich_text_to_string(project.description) == "Initial project description"
  end

  test "call/2 creates a project with only required params" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)

    assert {:ok, %{project: project}} =
             Create.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Project"
             })

    project =
      Project
      |> Operately.Repo.get!(ToolConnHelper.decode_id!(project.id))
      |> Operately.Repo.preload([:champion, :reviewer])

    assert project.name == "MCP Project"
    assert project.group_id == ctx.space.id
    assert is_nil(project.description)
    assert is_nil(project.goal_id)
    assert project.champion == nil
    assert project.reviewer == nil
  end
end
