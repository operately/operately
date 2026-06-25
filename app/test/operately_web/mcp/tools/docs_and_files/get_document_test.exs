defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.GetDocumentTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.GetDocument
  alias OperatelyWeb.Paths

  test "call/2 returns one document with comments" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub)
      |> Factory.preload(:document, :resource_hub)
      |> Factory.add_comment(:document_comment, :document)

    conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

    assert {:ok, %{document: document}} = GetDocument.call(conn, %{"document_id" => Paths.document_id(ctx.document)})
    assert document.id == Paths.document_id(ctx.document)
    assert length(document.comments) == 1
  end
end
