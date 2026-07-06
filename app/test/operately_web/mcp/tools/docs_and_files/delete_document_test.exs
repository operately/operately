defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.DeleteDocumentTest do
  use Operately.DataCase, async: true

  alias Operately.ResourceHubs.Document
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.DeleteDocument
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 deletes a document" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_document(:document, :hub)

    assert {:ok, %{document: document}} =
             DeleteDocument.call(ToolConnHelper.conn(ctx), %{
               "document_id" => Paths.document_id(ctx.document)
             })

    assert document.id == Paths.document_id(ctx.document)
    refute Operately.Repo.get(Document, ctx.document.id)
  end

  test "returns invalid_arguments for a malformed document id" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} =
             DeleteDocument.call(ToolConnHelper.conn(ctx), %{
               "document_id" => "definitely-not-a-valid-operately-id-%%%"
             })
  end
end
