defmodule Operately.Search.ResourceHubIndex.TreeTest do
  use Operately.DataCase

  alias Operately.Search.ResourceHubIndex.Tree
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_folder(:root, :hub)
    |> Factory.add_folder(:child, :hub, :root)
    |> Factory.add_folder(:grandchild, :hub, :child)
    |> Factory.add_document(:document, :hub, folder: :root)
    |> Factory.add_file(:resource_file, :hub, folder: :child)
    |> Factory.add_link(:link, :hub, folder: :grandchild)
    |> Factory.add_folder(:outside, :hub)
    |> Factory.add_document(:outside_document, :hub, folder: :outside)
  end

  test "loads a mixed subtree with one database query", ctx do
    query_counter = attach_query_counter()

    manifest = Tree.manifest(ctx.root.id)

    assert_manifest(manifest, %{
      "resource_hub_folder" => [ctx.root.id, ctx.child.id, ctx.grandchild.id],
      "resource_hub_document" => [ctx.document.id],
      "resource_hub_file" => [ctx.resource_file.id],
      "resource_hub_link" => [ctx.link.id]
    })

    assert_receive {^query_counter, :query}
    refute_receive {^query_counter, :query}
  end

  test "includes descendants after the root folder and node are soft-deleted", ctx do
    root = Repo.preload(ctx.root, :node)
    Repo.soft_delete!(root)
    Repo.soft_delete!(root.node)

    assert_manifest(Tree.manifest(root.id), %{
      "resource_hub_folder" => [ctx.root.id, ctx.child.id, ctx.grandchild.id],
      "resource_hub_document" => [ctx.document.id],
      "resource_hub_file" => [ctx.resource_file.id],
      "resource_hub_link" => [ctx.link.id]
    })
  end

  defp attach_query_counter do
    handler_id = {__MODULE__, self(), make_ref()}
    test_pid = self()

    :telemetry.attach(
      handler_id,
      [:operately, :repo, :query],
      fn _event, _measurements, _metadata, owner ->
        if self() == owner, do: send(owner, {handler_id, :query})
      end,
      test_pid
    )

    on_exit(fn -> :telemetry.detach(handler_id) end)
    handler_id
  end

  defp assert_manifest(actual, expected) do
    assert Map.keys(actual) |> Enum.sort() == Map.keys(expected) |> Enum.sort()

    Enum.each(expected, fn {source_type, source_ids} ->
      assert MapSet.new(Map.fetch!(actual, source_type)) == MapSet.new(source_ids)
    end)
  end
end
