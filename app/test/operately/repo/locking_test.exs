defmodule Operately.Repo.LockingTest do
  use Operately.DataCase

  alias Operately.Repo.Locking
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
  end

  test "lock_for_update locks the row and restores loaded associations", ctx do
    {:ok, document} =
      Operately.Operations.ResourceHubDocumentCreating.run(ctx.creator, ctx.hub, %{
        name: "Locked doc",
        content: RichText.rich_text("Content"),
        post_as_draft: true,
        send_to_everyone: false,
        subscription_parent_type: :resource_hub_document,
        subscriber_ids: [],
      })

    document = Repo.preload(document, [:resource_hub, :node])

    {:ok, locked} =
      Repo.transaction(fn ->
        {:ok, locked} = Locking.lock_for_update(Repo, document)
        locked
      end)

    assert locked.id == document.id
    assert Ecto.assoc_loaded?(locked.resource_hub)
    assert Ecto.assoc_loaded?(locked.node)
    assert locked.resource_hub.id == ctx.hub.id
  end

  test "lock_for_update returns not_found for a missing row" do
    missing = %Operately.ResourceHubs.Document{id: Ecto.UUID.generate()}

    assert {:ok, {:error, :not_found}} =
             Repo.transaction(fn ->
               Locking.lock_for_update(Repo, missing)
             end)
  end
end
