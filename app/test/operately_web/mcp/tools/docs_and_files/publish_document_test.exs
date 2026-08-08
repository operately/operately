defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.PublishDocumentTest do
  use Operately.DataCase, async: true

  alias Operately.Notifications.SubscriptionList
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
    assert document.name == "Published MCP Document"
    assert ToolConnHelper.rich_text_to_string(document.content) == "Published"
  end

  test "subscribes selected people from notify_person_ids" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:other)
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_document(:document, :hub, state: :draft)

    assert {:ok, %{document: document}} =
             PublishDocument.call(ToolConnHelper.conn(ctx), %{
               "document_id" => Paths.document_id(ctx.document),
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
      |> Factory.add_document(:document, :hub, state: :draft)

    assert {:ok, %{document: document}} =
             PublishDocument.call(ToolConnHelper.conn(ctx), %{
               "document_id" => Paths.document_id(ctx.document),
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
      |> Factory.add_document(:document, :hub, state: :draft)

    assert {:error, :invalid_arguments} =
             PublishDocument.call(ToolConnHelper.conn(ctx), %{
               "document_id" => Paths.document_id(ctx.document),
               "notify_person_ids" => ["definitely-not-a-valid-operately-id-%%%"]
             })
  end

  defp subscription_list!(parent_id) do
    {:ok, list} = SubscriptionList.get(:system, parent_id: parent_id, opts: [preload: :subscriptions])
    list
  end
end
