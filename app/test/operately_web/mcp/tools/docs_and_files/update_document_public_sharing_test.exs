defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.UpdateDocumentPublicSharingTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.UpdateDocumentPublicSharing, as: Tool
  alias OperatelyWeb.Paths

  test "enables and disables public sharing with resource permission checks" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.fetch_default_resource_hub(:hub, :space) |> Factory.add_document(:document, :hub)
    conn = ToolConnHelper.conn(ctx)
    args = %{"document_id" => Paths.document_id(ctx.document), "enabled" => true}

    assert {:ok, %{public_url: url}} = Tool.call(conn, args)
    assert is_binary(url)

    assert {:ok, %{public_url: nil}} = Tool.call(conn, Map.put(args, "enabled", false))
    assert {:error, :not_found} = Tool.call(ToolConnHelper.conn(Factory.setup(%{})), args)
    assert {:error, :invalid_arguments} = Tool.call(conn, Map.put(args, "enabled", "true"))
    assert {:error, :invalid_arguments} = Tool.call(conn, Map.put(args, "document_id", "invalid-%%"))
  end

  test "does not publicly share a draft" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.fetch_default_resource_hub(:hub, :space) |> Factory.add_document(:document, :hub, state: :draft)
    assert {:error, :bad_request, _} = Tool.call(ToolConnHelper.conn(ctx), %{"document_id" => Paths.document_id(ctx.document), "enabled" => true})
  end
end
