defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.DeleteFileTest do
  use Operately.DataCase, async: true

  alias Operately.ResourceHubs.File
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.DeleteFile
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 deletes a file" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_file(:file, :hub)

    assert {:ok, %{file: file}} =
             DeleteFile.call(ToolConnHelper.conn(ctx), %{
               "file_id" => Paths.file_id(ctx.file)
             })

    assert file.id == Paths.file_id(ctx.file)
    refute Operately.Repo.get(File, ctx.file.id)
  end

  test "returns invalid_arguments for a malformed file id" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} =
             DeleteFile.call(ToolConnHelper.conn(ctx), %{
               "file_id" => "definitely-not-a-valid-operately-id-%%%"
             })
  end
end
