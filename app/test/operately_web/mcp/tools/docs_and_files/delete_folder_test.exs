defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.DeleteFolderTest do
  use Operately.DataCase, async: true

  alias Operately.ResourceHubs.Folder
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.DeleteFolder
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 deletes a folder" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_folder(:folder, :hub)

    assert {:ok, %{success: true}} =
             DeleteFolder.call(ToolConnHelper.conn(ctx), %{
               "folder_id" => Paths.folder_id(ctx.folder)
             })

    refute Operately.Repo.get(Folder, ctx.folder.id)
  end

  test "returns invalid_arguments for a malformed folder id" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} =
             DeleteFolder.call(ToolConnHelper.conn(ctx), %{
               "folder_id" => "definitely-not-a-valid-operately-id-%%%"
             })
  end
end
