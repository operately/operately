defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.UpdateDocumentTest do
  use Operately.DataCase, async: true

  alias Operately.ResourceHubs.Document
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.UpdateDocument
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a document" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_document(:document, :hub)

    assert {:ok, %{document: document}} =
             UpdateDocument.call(ToolConnHelper.conn(ctx), %{
               "document_id" => Paths.document_id(ctx.document),
               "name" => "Updated MCP Document",
               "content" => "# Updated Document"
             })

    document =
      document.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(Document, &1))
      |> Operately.Repo.preload(:node)

    assert document.node.name == "Updated MCP Document"
    assert ToolConnHelper.rich_text_to_string(document.content) == "Updated Document"
  end
end
