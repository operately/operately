defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.GetDocumentVersionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.{Factory, RichText}
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.GetDocumentVersion
  alias OperatelyWeb.Paths

  test "call/2 returns one saved document version" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub)
      |> then(&create_extra_version/1)

    conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

    assert {:ok, %{version: version}} =
             GetDocumentVersion.call(conn, %{
               "document_id" => Paths.document_id(ctx.document),
               "version_number" => 1
             })

    assert version.version_number == 1
    refute version.is_current
    assert version.content != nil
  end

  defp create_extra_version(ctx) do
    document = Operately.Repo.preload(ctx.document, [:resource_hub, :node])

    {:ok, _} =
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: "Version two",
        content: RichText.rich_text("Second version")
      })

    Map.put(ctx, :document, Operately.Repo.reload!(document))
  end
end
