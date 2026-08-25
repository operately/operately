defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.RestoreDocumentVersionTest do
  use Operately.DataCase, async: true

  alias Operately.ResourceHubs.Document
  alias Operately.Support.{Factory, RichText}
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.RestoreDocumentVersion
  alias OperatelyWeb.Paths

  test "call/2 restores a saved document version" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub)
      |> then(&create_extra_version/1)

    document = Operately.Repo.reload!(ctx.document)
    assert document.current_version == 2

    assert {:ok, %{document: restored_document, restored_version: restored_version}} =
             RestoreDocumentVersion.call(ToolConnHelper.conn(ctx), %{
               "document_id" => Paths.document_id(document),
               "version_number" => 1,
               "expected_current_version" => 2
             })

    assert restored_document.current_version == 3
    assert restored_version.version_number == 3

    reloaded = Operately.Repo.get!(Document, document.id)
    assert reloaded.current_version == 3
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
