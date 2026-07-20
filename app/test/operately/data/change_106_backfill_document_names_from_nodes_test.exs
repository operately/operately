defmodule Operately.Data.Change106BackfillDocumentNamesFromNodesTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  alias Operately.Data.Change106BackfillDocumentNamesFromNodes, as: Change
  alias Operately.ResourceHubs.{Document, Node}
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      Factory.setup(ctx)
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)

    {:ok, ctx}
  end

  test "copies names from document nodes onto documents", ctx do
    node = insert_node_with_name(ctx.hub.id, "Legacy document title", :document)

    {:ok, subscription_list} = Operately.Notifications.create_subscription_list()

    document =
      insert_document_without_name(%{
        node_id: node.id,
        author_id: ctx.creator.id,
        state: :published,
        content: %{"type" => "doc", "content" => []},
        subscription_list_id: subscription_list.id
      })

    assert document.name == nil

    Change.run()

    document = Repo.get!(Document, document.id)
    assert document.name == "Legacy document title"
  end

  test "is idempotent", ctx do
    node = insert_node_with_name(ctx.hub.id, "Another title", :document)

    {:ok, subscription_list} = Operately.Notifications.create_subscription_list()

    insert_document_without_name(%{
      node_id: node.id,
      author_id: ctx.creator.id,
      state: :published,
      content: %{"type" => "doc", "content" => []},
      subscription_list_id: subscription_list.id
    })

    Change.run()
    Change.run()

    document =
      Repo.one!(from d in Document, where: d.node_id == ^node.id)

    assert document.name == "Another title"
  end

  test "skips documents that already have a name", ctx do
    {:ok, node} =
      Operately.ResourceHubs.create_node(%{
        resource_hub_id: ctx.hub.id,
        type: :document
      })

    {:ok, subscription_list} = Operately.Notifications.create_subscription_list()

    {:ok, document} =
      Operately.ResourceHubs.create_document(%{
        node_id: node.id,
        author_id: ctx.creator.id,
        name: "Existing title",
        state: :published,
        content: %{"type" => "doc", "content" => []},
        subscription_list_id: subscription_list.id
      })

    Change.run()

    document = Repo.get!(Document, document.id)
    assert document.name == "Existing title"
  end

  defp insert_node_with_name(hub_id, name, type) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    {:ok, node} =
      %Node{}
      |> Ecto.Changeset.change(%{
        resource_hub_id: hub_id,
        name: name,
        type: type,
        inserted_at: now,
        updated_at: now
      })
      |> Repo.insert()

    node
  end

  defp insert_document_without_name(attrs) do
    Ecto.Adapters.SQL.query!(Repo, "ALTER TABLE resource_documents ALTER COLUMN name DROP NOT NULL")

    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    {:ok, document} =
      %Document{}
      |> Ecto.Changeset.change(Map.merge(attrs, %{inserted_at: now, updated_at: now}))
      |> Repo.insert()

    document
  end
end
