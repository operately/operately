defmodule OperatelyWeb.Api.Subscriptions.DocumentUpdatedTest do
  use OperatelyWeb.ChannelCase

  alias Operately.Support.Factory
  alias OperatelyWeb.Api.Subscriptions.DocumentUpdated
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub)
    |> Factory.add_space_member(:viewer, :space)
  end

  test "joins the canonical document topic for a reader", ctx do
    socket = socket(OperatelyWeb.ApiSocket, "test", %{person: ctx.viewer, company: ctx.company})
    assert {:ok, ^socket, [id]} = DocumentUpdated.join("document_updated", %{"documentId" => Paths.document_id(ctx.document)}, socket)
    assert id == ctx.document.id
  end

  test "rejects missing, malformed, nonexistent and inaccessible documents", ctx do
    ctx =
      ctx
      |> Factory.add_space(:private, company_permissions: 0)
      |> Factory.add_resource_hub(:private_hub, :private, :creator)
      |> Factory.add_document(:private_document, :private_hub)

    socket = socket(OperatelyWeb.ApiSocket, "test", %{person: ctx.viewer, company: ctx.company})

    for id <- [nil, 123, [], "", "invalid", Ecto.UUID.generate(), Paths.document_id(ctx.private_document)] do
      assert {:error, _} = DocumentUpdated.join("document_updated", %{"documentId" => id}, socket)
    end
  end

  test "rejects another company and missing membership", ctx do
    socket = socket(OperatelyWeb.ApiSocket, "test", %{person: ctx.creator, company: %{id: Ecto.UUID.generate()}})
    assert {:error, _} = DocumentUpdated.join("document_updated", %{"documentId" => ctx.document.id}, socket)
    assert {:error, _} = DocumentUpdated.join("document_updated", %{"documentId" => ctx.document.id}, socket(OperatelyWeb.ApiSocket))
  end

  test "broadcasts empty events only after successful outer transactions", ctx do
    topic = "api:document_updated:#{ctx.document.id}"
    OperatelyWeb.Endpoint.subscribe(topic)
    assert {:ok, :updated} = result = Operately.Repo.transaction(fn -> :updated end)
    assert ^result = DocumentUpdated.broadcast_result(result, ctx.document.id)
    assert_receive %Phoenix.Socket.Broadcast{topic: ^topic, event: "event", payload: %{}}

    error = {:error, :document, :invalid, %{}}
    assert ^error = DocumentUpdated.broadcast_result(error, ctx.document.id)

    assert {:error, :rollback} =
             Operately.Repo.transaction(fn ->
               DocumentUpdated.broadcast_result({:ok, :updated}, ctx.document.id)
               Operately.Repo.rollback(:rollback)
             end)

    refute_receive %Phoenix.Socket.Broadcast{topic: ^topic}
  end

  test "the registered channel accepts an authorized reader", ctx do
    socket = socket(OperatelyWeb.ApiSocket, "test", %{account: Operately.Repo.preload(ctx.viewer, :account).account})

    assert {:ok, _, _} =
             subscribe_and_join(socket, OperatelyWeb.ApiSocket.Channel, "api:document_updated", %{
               "x-company-id" => Paths.company_id(ctx.company),
               "documentId" => Paths.document_id(ctx.document)
             })

    DocumentUpdated.broadcast_result({:ok, :updated}, ctx.document.id)
    assert_push "event", %{}
  end
end
