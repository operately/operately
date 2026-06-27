defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.RenameFolderTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.RenameFolder
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 renames a folder" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_folder(:folder, :hub)

    assert {:ok, %{success: true}} =
             RenameFolder.call(ToolConnHelper.conn(ctx), %{
               "folder_id" => Paths.folder_id(ctx.folder),
               "name" => "Updated MCP Folder"
             })

    folder = ToolConnHelper.reload(ctx.folder, [:node])

    assert folder.node.name == "Updated MCP Folder"
  end
end
