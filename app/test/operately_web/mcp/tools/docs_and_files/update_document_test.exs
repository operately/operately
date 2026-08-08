defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.UpdateDocumentTest do
  use Operately.DataCase, async: true

  alias Operately.Notifications.SubscriptionList
  alias Operately.ResourceHubs.Document
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.UpdateDocument
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a document with safe notification defaults" do
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

    assert document.name == "Updated MCP Document"
    assert ToolConnHelper.rich_text_to_string(document.content) == "Updated Document"

    list = subscription_list!(document.id)

    refute list.send_to_everyone
  end

  test "subscribes selected people from notify_person_ids" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:other)
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_document(:document, :hub)

    assert {:ok, %{document: document}} =
             UpdateDocument.call(ToolConnHelper.conn(ctx), %{
               "document_id" => Paths.document_id(ctx.document),
               "name" => "Updated MCP Document",
               "content" => "# Updated Document",
               "notify_person_ids" => [Paths.person_id(ctx.other)]
             })

    list = subscription_list!(ToolConnHelper.decode_id!(document.id))

    refute list.send_to_everyone
    assert Enum.any?(list.subscriptions, &(&1.person_id == ctx.other.id and not &1.canceled))
  end

  test "sets send_to_everyone when notify_everyone is true" do
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
               "content" => "# Updated Document",
               "notify_everyone" => true
             })

    list = subscription_list!(ToolConnHelper.decode_id!(document.id))

    assert list.send_to_everyone
  end

  test "returns invalid_arguments for malformed notify_person_ids" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_document(:document, :hub)

    assert {:error, :invalid_arguments} =
             UpdateDocument.call(ToolConnHelper.conn(ctx), %{
               "document_id" => Paths.document_id(ctx.document),
               "name" => "Updated MCP Document",
               "content" => "# Updated Document",
               "notify_person_ids" => ["definitely-not-a-valid-operately-id-%%%"]
             })
  end

  defp subscription_list!(parent_id) do
    {:ok, list} = SubscriptionList.get(:system, parent_id: parent_id, opts: [preload: :subscriptions])
    list
  end
end
