defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.CreateFolderTest do
  use Operately.DataCase, async: true

  alias Operately.ResourceHubs.Folder
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.CreateFolder
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 creates a folder in a space hub" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)

    assert {:ok, %{folder: folder}} =
             CreateFolder.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Folder"
             })

    folder =
      folder.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(Folder, &1))
      |> Operately.Repo.preload(:node)

    assert folder.node.name == "MCP Folder"
    assert is_nil(folder.node.parent_folder_id)
  end

  test "call/2 creates a folder in a project hub" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.fetch_default_project_resource_hub(:hub, :project)

    assert {:ok, %{folder: folder}} =
             CreateFolder.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "name" => "Project MCP Folder"
             })

    folder =
      folder.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(Folder, &1))
      |> Operately.Repo.preload(:node)

    assert folder.node.name == "Project MCP Folder"
  end

  test "call/2 creates a nested folder when folder_id is provided" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_folder(:parent_folder, :hub)

    assert {:ok, %{folder: folder}} =
             CreateFolder.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "folder_id" => Paths.folder_id(ctx.parent_folder),
               "name" => "Nested MCP Folder"
             })

    folder =
      folder.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(Folder, &1))
      |> Operately.Repo.preload(:node)

    assert folder.node.name == "Nested MCP Folder"
    assert folder.node.parent_folder_id == ctx.parent_folder.id
  end

  test "returns invalid_arguments when hub scope is missing" do
    ctx =
      %{}
      |> Factory.setup()

    assert {:error, :invalid_arguments} =
             CreateFolder.call(ToolConnHelper.conn(ctx), %{
               "name" => "MCP Folder"
             })
  end

  test "returns invalid_arguments for conflicting hub scopes" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:error, :invalid_arguments} =
             CreateFolder.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "project_id" => Paths.project_id(ctx.project),
               "name" => "MCP Folder"
             })
  end
end
