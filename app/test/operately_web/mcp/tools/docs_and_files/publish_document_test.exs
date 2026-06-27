defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.PublishDocumentTest do
  use Operately.DataCase, async: true

  alias Operately.ResourceHubs.Document
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.PublishDocument
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 publishes a draft document" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_document(:document, :hub, state: :draft)

    assert {:ok, %{document: document}} =
             PublishDocument.call(ToolConnHelper.conn(ctx), %{
               "document_id" => Paths.document_id(ctx.document),
               "name" => "Published MCP Document",
               "content" => "# Published"
             })

    document =
      document.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(Document, &1))
      |> Operately.Repo.preload(:node)

    assert document.state == :published
    assert document.node.name == "Published MCP Document"
    assert ToolConnHelper.rich_text_to_string(document.content) == "Published"
  end
end
