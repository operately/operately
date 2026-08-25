defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.ListDocumentVersionsTest do
  use Operately.DataCase, async: true

  alias Operately.Support.{Factory, RichText}
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.ListDocumentVersions
  alias OperatelyWeb.Paths

  test "call/2 returns document versions newest first" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub)
      |> then(&create_extra_version/1)

    conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

    assert {:ok, %{versions: versions}} =
             ListDocumentVersions.call(conn, %{"document_id" => Paths.document_id(ctx.document)})

    assert Enum.map(versions, & &1.version_number) == [2, 1]
    assert hd(versions).is_current
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
