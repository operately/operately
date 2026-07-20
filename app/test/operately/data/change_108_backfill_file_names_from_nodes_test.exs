defmodule Operately.Data.Change108BackfillFileNamesFromNodesTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  alias Operately.Data.Change108BackfillFileNamesFromNodes, as: Change
  alias Operately.ResourceHubs.File
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      Factory.setup(ctx)
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_blob(:blob)

    {:ok, ctx}
  end

  test "copies names from file nodes onto files", ctx do
    {:ok, node} =
      Operately.ResourceHubs.create_node(%{
        resource_hub_id: ctx.hub.id,
        name: "Legacy file title",
        type: :file
      })

    {:ok, subscription_list} = Operately.Notifications.create_subscription_list()

    file =
      insert_file_without_name(%{
        node_id: node.id,
        author_id: ctx.creator.id,
        blob_id: ctx.blob.id,
        description: %{"type" => "doc", "content" => []},
        subscription_list_id: subscription_list.id
      })

    assert file.name == nil

    Change.run()

    file = Repo.get!(File, file.id)
    assert file.name == "Legacy file title"
  end

  test "is idempotent", ctx do
    {:ok, node} =
      Operately.ResourceHubs.create_node(%{
        resource_hub_id: ctx.hub.id,
        name: "Another title",
        type: :file
      })

    {:ok, subscription_list} = Operately.Notifications.create_subscription_list()

    insert_file_without_name(%{
      node_id: node.id,
      author_id: ctx.creator.id,
      blob_id: ctx.blob.id,
      description: %{"type" => "doc", "content" => []},
      subscription_list_id: subscription_list.id
    })

    Change.run()
    Change.run()

    file =
      Repo.one!(from f in File, where: f.node_id == ^node.id)

    assert file.name == "Another title"
  end

  test "skips files that already have a name", ctx do
    {:ok, node} =
      Operately.ResourceHubs.create_node(%{
        resource_hub_id: ctx.hub.id,
        name: "Node title",
        type: :file
      })

    {:ok, subscription_list} = Operately.Notifications.create_subscription_list()

    {:ok, file} =
      Operately.ResourceHubs.create_file(%{
        node_id: node.id,
        author_id: ctx.creator.id,
        name: "Existing title",
        blob_id: ctx.blob.id,
        description: %{"type" => "doc", "content" => []},
        subscription_list_id: subscription_list.id
      })

    Change.run()

    file = Repo.get!(File, file.id)
    assert file.name == "Existing title"
  end

  defp insert_file_without_name(attrs) do
    Ecto.Adapters.SQL.query!(Repo, "ALTER TABLE resource_files ALTER COLUMN name DROP NOT NULL")

    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    {:ok, file} =
      %File{}
      |> Ecto.Changeset.change(Map.merge(attrs, %{inserted_at: now, updated_at: now}))
      |> Repo.insert()

    file
  end
end
