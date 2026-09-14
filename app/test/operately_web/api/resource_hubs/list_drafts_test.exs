defmodule OperatelyWeb.Api.ResourceHubs.ListDraftsTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query

  alias Operately.ResourceHubs.{Document, Node}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.log_in_person(:creator)
    |> Factory.add_space(:space)
    |> Factory.fetch_default_resource_hub(:hub, :space)
  end

  test "requires authentication", ctx do
    conn = Phoenix.ConnTest.build_conn()
    assert {401, _} = query(conn, [:resource_hubs, :list_drafts], %{resource_hub_id: Paths.resource_hub_id(ctx.hub)})
  end

  test "empty hubs return an empty list", ctx do
    assert {200, %{draft_nodes: []}} = list_drafts(ctx)
  end

  test "exposes both external routes and preserves the internal resource hub route" do
    assert Map.has_key?(OperatelyWeb.Api.External.__queries__(), "resource_hubs/list_drafts")
    assert Map.has_key?(OperatelyWeb.Api.External.__queries__(), "documents/list_drafts")
    assert Map.has_key?(OperatelyWeb.Api.Internal.__queries__(), "resource_hubs/list_drafts")
    refute Map.has_key?(OperatelyWeb.Api.Internal.__queries__(), "documents/list_drafts")
  end

  test "supports project and goal hubs", ctx do
    ctx =
      ctx
      |> Factory.add_project(:project, :space)
      |> Factory.fetch_default_project_resource_hub(:project_hub, :project)
      |> Factory.add_goal(:goal, :space, champion: :creator, reviewer: :creator)
      |> Factory.fetch_default_goal_resource_hub(:goal_hub, :goal)

    for hub_key <- [:project_hub, :goal_hub] do
      ctx = ctx |> Factory.add_folder(:folder, hub_key) |> Factory.add_document(:draft, hub_key, folder: :folder, state: :draft)
      assert {200, %{draft_nodes: [draft]}} = list_drafts(%{ctx | hub: Map.fetch!(ctx, hub_key)})
      assert draft.document.id == Paths.document_id(ctx.draft)
    end
  end

  test "excludes cross-hub folder ancestry", ctx do
    ctx =
      ctx
      |> Factory.add_space(:other_space)
      |> Factory.fetch_default_resource_hub(:other_hub, :other_space)
      |> Factory.add_folder(:other_folder, :other_hub)
      |> Factory.add_document(:cross_hub, :hub, folder: :other_folder, state: :draft)

    assert {200, %{draft_nodes: []}} = list_drafts(ctx)
  end

  test "lists only the requester's drafts throughout the hub with ordered paths", ctx do
    ctx =
      ctx
      |> Factory.add_folder(:parent, :hub)
      |> Factory.add_folder(:child, :hub, :parent)
      |> Factory.add_document(:root_draft, :hub, state: :draft)
      |> Factory.add_document(:nested_draft, :hub, folder: :child, state: :draft)
      |> Factory.add_document(:published, :hub, folder: :child)
      |> Factory.add_company_member(:other)
      |> Factory.add_document(:other_draft, :hub, author: :other, state: :draft)
      |> Factory.add_space(:other_space)
      |> Factory.fetch_default_resource_hub(:other_hub, :other_space)
      |> Factory.add_document(:other_hub_draft, :other_hub, state: :draft)

    assert {200, %{draft_nodes: drafts}} = list_drafts(ctx)
    assert MapSet.new(Enum.map(drafts, & &1.document.id)) == MapSet.new([Paths.document_id(ctx.root_draft), Paths.document_id(ctx.nested_draft)])
    root = Enum.find(drafts, &(&1.document.id == Paths.document_id(ctx.root_draft)))
    nested = Enum.find(drafts, &(&1.document.id == Paths.document_id(ctx.nested_draft)))
    assert root.path_to_node == []
    assert Enum.map(nested.path_to_node, & &1.id) == [Paths.folder_id(ctx.parent), Paths.folder_id(ctx.child)]
  end

  test "excludes deleted documents, nodes, and descendants of deleted folders", ctx do
    ctx =
      ctx
      |> Factory.add_folder(:parent, :hub)
      |> Factory.add_folder(:child, :hub, :parent)
      |> Factory.add_document(:nested, :hub, folder: :child, state: :draft)
      |> Factory.add_document(:deleted, :hub, state: :draft)
      |> Factory.add_document(:deleted_node, :hub, state: :draft)

    Repo.soft_delete!(ctx.parent)
    Repo.soft_delete!(ctx.deleted)
    Repo.soft_delete!(Repo.get!(Node, ctx.deleted_node.node_id))
    assert {200, %{draft_nodes: []}} = list_drafts(ctx)
  end

  test "sorts by document modification time with a stable ID tiebreaker", ctx do
    ctx =
      ctx
      |> Factory.add_document(:older, :hub, state: :draft)
      |> Factory.add_document(:recent, :hub, state: :draft)
      |> Factory.add_document(:same_time, :hub, state: :draft)

    Repo.update_all(from(d in Document, where: d.id == ^ctx.older.id), set: [updated_at: ~N[2020-01-01 00:00:00]])
    Repo.update_all(from(d in Document, where: d.id in ^[ctx.recent.id, ctx.same_time.id]), set: [updated_at: ~N[2021-01-01 00:00:00]])
    assert {200, %{draft_nodes: drafts}} = list_drafts(ctx)
    expected = Enum.sort_by([ctx.recent, ctx.same_time], & &1.id) ++ [ctx.older]
    assert Enum.map(drafts, & &1.document.id) == Enum.map(expected, &Paths.document_id/1)
  end

  test "returns not found when the requester cannot view the hub", ctx do
    ctx = ctx |> Factory.add_company_member(:outsider) |> Factory.log_in_person(:outsider)
    ctx = Factory.add_space(ctx, :private_space, company_permissions: 0)
    ctx = Factory.fetch_default_resource_hub(ctx, :private_hub, :private_space)
    assert {404, _} = query(ctx.conn, [:resource_hubs, :list_drafts], %{resource_hub_id: Paths.resource_hub_id(ctx.private_hub)})
  end

  defp list_drafts(ctx) do
    query(ctx.conn, [:resource_hubs, :list_drafts], %{resource_hub_id: Paths.resource_hub_id(ctx.hub)})
  end
end
