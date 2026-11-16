defmodule Operately.ResourceHubs.ResourceHubTest do
  use Operately.DataCase

  alias Operately.ResourceHubs.{Node, ResourceHub}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  describe "load_comments_count/1" do
    for hub_count <- [2, 6] do
      @hub_count hub_count

      test "loads counts for #{@hub_count} populated hubs with one aggregate, preserving contents and ordering", ctx do
        populated_hubs = Enum.map(1..@hub_count, &populated_hub(ctx, &1)) |> Enum.reverse()

        ctx =
          ctx
          |> Factory.add_resource_hub(:folder_hub, :space, :creator)
          |> Factory.add_folder(:only_folder, :folder_hub)
          |> Factory.add_resource_hub(:empty_hub, :space, :creator)

        folder_hub = load_hub(ctx.folder_hub, [ctx.only_folder.node_id])
        empty_hub = load_hub(ctx.empty_hub, [])
        {hubs, expected_hubs} = Enum.unzip(populated_hubs)
        hubs = [empty_hub | hubs] ++ [folder_hub]
        expected_hubs = [empty_hub | expected_hubs] ++ [folder_hub]
        query_counter = attach_query_counter()

        assert ResourceHub.load_comments_count(hubs) == expected_hubs
        assert_receive {^query_counter, :comment_aggregate}
        refute_receive {^query_counter, :comment_aggregate}
      end
    end

    test "returns an empty collection without querying" do
      query_counter = attach_query_counter()

      assert ResourceHub.load_comments_count([]) == []
      refute_receive {^query_counter, _query}
    end

    test "preserves direct single-hub loading", ctx do
      {hub, expected_hub} = populated_hub(ctx, 1)
      query_counter = attach_query_counter()

      assert ResourceHub.load_comments_count(hub) == expected_hub
      assert_receive {^query_counter, :comment_aggregate}
      refute_receive {^query_counter, :comment_aggregate}
    end
  end

  defp populated_hub(ctx, index) do
    ctx =
      ctx
      |> Factory.add_resource_hub(:hub, :space, :creator, name: "Hub #{index}")
      |> Factory.add_document(:document, :hub)
      |> Factory.add_file(:resource_file, :hub)
      |> Factory.add_link(:link, :hub)
      |> Factory.add_link(:zero_count_link, :hub)
      |> Factory.add_folder(:folder, :hub)
      |> Factory.add_document(:nested_document, :hub, folder: :folder)
      |> Factory.add_document(:draft, :hub, state: :draft)
      |> Factory.preload(:document, :resource_hub)
      |> Factory.preload(:resource_file, :resource_hub)
      |> Factory.preload(:link, :resource_hub)
      |> Factory.preload(:nested_document, :resource_hub)
      |> Factory.add_comment(:document_comment1, :document)
      |> Factory.add_comment(:document_comment2, :document)
      |> Factory.add_comment(:file_comment, :resource_file)
      |> Factory.add_comment(:link_comment1, :link)
      |> Factory.add_comment(:link_comment2, :link)
      |> Factory.add_comment(:link_comment3, :link)
      |> Factory.add_comment(:unrelated_comment, :nested_document)

    hub = load_hub(ctx.hub, [ctx.link.node_id, ctx.folder.node_id, ctx.document.node_id, ctx.zero_count_link.node_id, ctx.resource_file.node_id])
    [link, folder, document, zero_count_link, resource_file] = hub.nodes
    assert folder.folder.children_count == 1

    expected_hub = %{
      hub
      | nodes: [
          %{link | link: %{link.link | comments_count: 3}},
          folder,
          %{document | document: %{document.document | comments_count: 2}},
          %{zero_count_link | link: %{zero_count_link.link | comments_count: 0}},
          %{resource_file | file: %{resource_file.file | comments_count: 1}}
        ]
    }

    {hub, expected_hub}
  end

  defp load_hub(hub, node_ids) do
    nodes_query = from(n in Node, where: is_nil(n.parent_folder_id)) |> Node.preload_content()
    hub = Repo.preload(hub, [:space, nodes: nodes_query]) |> ResourceHub.set_children_count()
    assert MapSet.new(Enum.map(hub.nodes, & &1.id)) == MapSet.new(node_ids)
    nodes_by_id = Map.new(hub.nodes, &{&1.id, &1})

    %{hub | nodes: Enum.map(node_ids, &Map.fetch!(nodes_by_id, &1))}
  end

  defp attach_query_counter do
    handler_id = {__MODULE__, self(), make_ref()}

    :ok =
      :telemetry.attach(
        handler_id,
        [:operately, :repo, :query],
        fn _event, _measurements, metadata, {owner, invocation} ->
          if self() == owner do
            aggregate? = metadata.source == "comments" and String.contains?(metadata.query, "count(") and String.contains?(metadata.query, "GROUP BY")
            send(owner, {invocation, if(aggregate?, do: :comment_aggregate, else: :query)})
          end
        end,
        {self(), handler_id}
      )

    on_exit(fn -> :telemetry.detach(handler_id) end)
    handler_id
  end
end
