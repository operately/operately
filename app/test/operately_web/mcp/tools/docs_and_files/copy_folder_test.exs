defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.CopyFolderTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.CopyFolder, as: Tool
  alias OperatelyWeb.Paths

  test "copies into the selected folder and rejects foreign or malformed destinations" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.fetch_default_resource_hub(:hub, :space) |> Factory.add_folder(:source, :hub) |> Factory.add_folder(:destination, :hub)
    conn = ToolConnHelper.conn(ctx)
    args = %{"folder_id" => Paths.folder_id(ctx.source), "folder_name" => "Copied", "dest_parent_folder_id" => Paths.folder_id(ctx.destination)}

    assert {:ok, %{folder_id: id}} = Tool.call(conn, args)
    folder = Repo.get!(Operately.ResourceHubs.Folder, ToolConnHelper.decode_id!(id)) |> Repo.preload(:node)
    assert folder.name == "Copied"
    assert folder.node.parent_folder_id == ctx.destination.id
    other = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.fetch_default_resource_hub(:hub, :space) |> Factory.add_folder(:folder, :hub)

    assert {:error, :not_found} = Tool.call(ToolConnHelper.conn(other), args)
    assert {:error, :not_found} = Tool.call(conn, Map.put(args, "dest_parent_folder_id", Paths.folder_id(other.folder)))
    assert {:error, :invalid_arguments} = Tool.call(conn, Map.put(args, "folder_id", "invalid-%%"))
    assert {:ok, %{folder_id: root_id}} = Tool.call(conn, %{"folder_id" => Paths.folder_id(ctx.source)})
    root_copy = Repo.get!(Operately.ResourceHubs.Folder, ToolConnHelper.decode_id!(root_id)) |> Repo.preload(:node)
    assert root_copy.node.parent_folder_id == nil
  end
end
