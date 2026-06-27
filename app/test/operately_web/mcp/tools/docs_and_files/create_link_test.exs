defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.CreateLinkTest do
  use Operately.DataCase, async: true

  alias Operately.ResourceHubs.Link
  alias Operately.RichContent.Builder
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.CreateLink
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 creates a link in a space hub" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)

    assert {:ok, %{link: link}} =
             CreateLink.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Link",
               "url" => "https://example.com",
               "type" => "other",
               "description" => "Initial link description"
             })

    link = Operately.Repo.get!(Link, ToolConnHelper.decode_id!(link.id))

    assert link.url == "https://example.com"
    assert ToolConnHelper.rich_text_to_string(link.description) == "Initial link description"
  end

  test "call/2 creates a link with optional fields omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)

    assert {:ok, %{link: link}} =
             CreateLink.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Link",
               "url" => "https://example.com",
               "type" => "other"
             })

    link = Operately.Repo.get!(Link, ToolConnHelper.decode_id!(link.id))

    assert link.url == "https://example.com"
    assert link.type == :other
    assert link.description == Builder.empty_content()
  end

  test "call/2 creates a link in a project hub" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.fetch_default_project_resource_hub(:hub, :project)

    assert {:ok, %{link: link}} =
             CreateLink.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "name" => "Project MCP Link",
               "url" => "https://example.com/project",
               "type" => "notion"
             })

    link = Operately.Repo.get!(Link, ToolConnHelper.decode_id!(link.id))

    assert link.url == "https://example.com/project"
    assert link.type == :notion
  end

  test "returns invalid_arguments when hub scope is missing" do
    ctx =
      %{}
      |> Factory.setup()

    assert {:error, :invalid_arguments} =
             CreateLink.call(ToolConnHelper.conn(ctx), %{
               "name" => "MCP Link",
               "url" => "https://example.com",
               "type" => "other"
             })
  end

  test "returns invalid_arguments for conflicting hub scopes" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:error, :invalid_arguments} =
             CreateLink.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "project_id" => Paths.project_id(ctx.project),
               "name" => "MCP Link",
               "url" => "https://example.com",
               "type" => "other"
             })
  end

  test "returns invalid_arguments for an unsupported link type" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)

    assert {:error, :invalid_arguments} =
             CreateLink.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Link",
               "url" => "https://example.com",
               "type" => "invalid"
             })
  end
end
