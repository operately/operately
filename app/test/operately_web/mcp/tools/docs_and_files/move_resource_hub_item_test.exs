defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.MoveResourceHubItemTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.MoveResourceHubItem
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "rejects a foreign destination" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.fetch_default_resource_hub(:hub, :space) |> Factory.add_document(:document, :hub)
    foreign = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.fetch_default_resource_hub(:hub, :space) |> Factory.add_folder(:folder, :hub)
    activities = Repo.aggregate(Operately.Activities.Activity, :count)

    assert {:error, :not_found} =
             MoveResourceHubItem.call(ToolConnHelper.conn(ctx), %{"resource_type" => "document", "resource_id" => Paths.document_id(ctx.document), "folder_id" => Paths.folder_id(foreign.folder)})

    assert ToolConnHelper.reload(ctx.document, [:node]).node.parent_folder_id == nil
    assert Repo.aggregate(Operately.Activities.Activity, :count) == activities
  end

  test "call/2 moves a document into a folder" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_document(:document, :hub)
      |> Factory.add_folder(:folder, :hub)

    assert {:ok, %{success: true}} =
             MoveResourceHubItem.call(ToolConnHelper.conn(ctx), %{
               "resource_type" => "document",
               "resource_id" => Paths.document_id(ctx.document),
               "folder_id" => Paths.folder_id(ctx.folder)
             })

    document =
      ctx.document
      |> ToolConnHelper.reload([:node])

    assert document.node.parent_folder_id == ctx.folder.id
  end
end
