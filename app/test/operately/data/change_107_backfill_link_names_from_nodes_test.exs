defmodule Operately.Data.Change107BackfillLinkNamesFromNodesTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  alias Operately.Data.Change107BackfillLinkNamesFromNodes, as: Change
  alias Operately.ResourceHubs.{Link, Node}
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      Factory.setup(ctx)
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)

    {:ok, ctx}
  end

  test "copies names from link nodes onto links", ctx do
    node = insert_node_with_name(ctx.hub.id, "Legacy link title", :link)

    {:ok, subscription_list} = Operately.Notifications.create_subscription_list()

    link =
      insert_link_without_name(%{
        node_id: node.id,
        author_id: ctx.creator.id,
        url: "https://example.com",
        type: :other,
        description: %{"type" => "doc", "content" => []},
        subscription_list_id: subscription_list.id
      })

    assert link.name == nil

    Change.run()

    link = Repo.get!(Link, link.id)
    assert link.name == "Legacy link title"
  end

  test "is idempotent", ctx do
    node = insert_node_with_name(ctx.hub.id, "Another title", :link)

    {:ok, subscription_list} = Operately.Notifications.create_subscription_list()

    insert_link_without_name(%{
      node_id: node.id,
      author_id: ctx.creator.id,
      url: "https://example.com",
      type: :other,
      description: %{"type" => "doc", "content" => []},
      subscription_list_id: subscription_list.id
    })

    Change.run()
    Change.run()

    link =
      Repo.one!(from l in Link, where: l.node_id == ^node.id)

    assert link.name == "Another title"
  end

  test "skips links that already have a name", ctx do
    {:ok, node} =
      Operately.ResourceHubs.create_node(%{
        resource_hub_id: ctx.hub.id,
        type: :link
      })

    {:ok, subscription_list} = Operately.Notifications.create_subscription_list()

    {:ok, link} =
      Operately.ResourceHubs.create_link(%{
        node_id: node.id,
        author_id: ctx.creator.id,
        name: "Existing title",
        url: "https://example.com",
        type: :other,
        description: %{"type" => "doc", "content" => []},
        subscription_list_id: subscription_list.id
      })

    Change.run()

    link = Repo.get!(Link, link.id)
    assert link.name == "Existing title"
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

  defp insert_link_without_name(attrs) do
    Ecto.Adapters.SQL.query!(Repo, "ALTER TABLE resource_links ALTER COLUMN name DROP NOT NULL")

    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    {:ok, link} =
      %Link{}
      |> Ecto.Changeset.change(Map.merge(attrs, %{inserted_at: now, updated_at: now}))
      |> Repo.insert()

    link
  end
end
