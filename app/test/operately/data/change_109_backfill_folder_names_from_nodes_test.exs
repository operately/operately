defmodule Operately.Data.Change109BackfillFolderNamesFromNodesTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  alias Operately.Data.Change109BackfillFolderNamesFromNodes, as: Change
  alias Operately.ResourceHubs.{Folder, Node}
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      Factory.setup(ctx)
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)

    {:ok, ctx}
  end

  test "copies names from folder nodes onto folders", ctx do
    node = insert_node_with_name(ctx.hub.id, "Legacy folder title")

    folder =
      insert_folder_without_name(%{
        node_id: node.id
      })

    assert folder.name == nil

    Change.run()

    folder = Repo.get!(Folder, folder.id)
    assert folder.name == "Legacy folder title"
  end

  test "is idempotent", ctx do
    node = insert_node_with_name(ctx.hub.id, "Another title")

    insert_folder_without_name(%{node_id: node.id})

    Change.run()
    Change.run()

    folder =
      Repo.one!(from f in Folder, where: f.node_id == ^node.id)

    assert folder.name == "Another title"
  end

  test "skips folders that already have a name", ctx do
    {:ok, node} =
      Operately.ResourceHubs.create_node(%{
        resource_hub_id: ctx.hub.id,
        type: :folder
      })

    {:ok, folder} =
      Operately.ResourceHubs.create_folder(%{
        node_id: node.id,
        name: "Existing title"
      })

    Change.run()

    folder = Repo.get!(Folder, folder.id)
    assert folder.name == "Existing title"
  end

  defp insert_node_with_name(hub_id, name) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    {:ok, node} =
      %Node{}
      |> Ecto.Changeset.change(%{
        resource_hub_id: hub_id,
        name: name,
        type: :folder,
        inserted_at: now,
        updated_at: now
      })
      |> Repo.insert()

    node
  end

  defp insert_folder_without_name(attrs) do
    Ecto.Adapters.SQL.query!(Repo, "ALTER TABLE resource_folders ALTER COLUMN name DROP NOT NULL")

    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    {:ok, folder} =
      %Folder{}
      |> Ecto.Changeset.change(Map.merge(attrs, %{inserted_at: now, updated_at: now}))
      |> Repo.insert()

    folder
  end
end
