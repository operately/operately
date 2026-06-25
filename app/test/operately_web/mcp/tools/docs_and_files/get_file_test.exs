defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.GetFileTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.GetFile
  alias OperatelyWeb.Paths

  test "call/2 returns one file with comments" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_file(:file, :hub)
      |> Factory.preload(:file, :resource_hub)
      |> Factory.add_comment(:file_comment, :file)

    conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

    assert {:ok, %{file: file}} = GetFile.call(conn, %{"file_id" => Paths.file_id(ctx.file)})
    assert file.id == Paths.file_id(ctx.file)
    assert length(file.comments) == 1
  end
end
