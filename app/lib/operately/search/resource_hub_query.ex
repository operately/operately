defmodule Operately.Search.ResourceHubQuery do
  @moduledoc """
  Finds and hydrates relevance-ranked nodes inside an already-authorized resource hub.

  Candidate selection verifies the current resource, node, and folder hierarchy
  before ranking. The selected nodes are then loaded with the same resource data
  displayed by ordinary resource-hub lists. Authorization belongs to the API endpoint.
  """

  import Ecto.Query

  alias Operately.Repo
  alias Operately.ResourceHubs.{Document, File, Folder, Link, Node, ResourceHub}
  alias Operately.Search.{Entry, Text}

  @limit 30

  def search(%ResourceHub{} = hub, query) do
    normalized_query = Text.normalize_query(query)

    if String.length(Text.normalize_title(normalized_query)) < 2 do
      []
    else
      hub.id
      |> candidate_query(normalized_query)
      |> Repo.all()
      |> load_nodes()
    end
  end

  defp candidate_query(hub_id, query) do
    normalized_title = Text.normalize_title(query)
    title_prefix = title_prefix_pattern(normalized_title)
    eligible_items = eligible_items_query(hub_id)
    visible_nodes = visible_nodes_query(hub_id)

    from(entry in Entry,
      join: item in subquery(eligible_items),
      on: item.source_id == entry.source_id and item.source_type == entry.source_type,
      join: visible_node in "visible_search_nodes",
      on: visible_node.node_id == item.node_id,
      where: entry.resource_hub_id == ^hub_id,
      where:
        fragment(
          "? @@ websearch_to_tsquery('public.operately'::regconfig, ?)",
          field(entry, :search_vector),
          ^query
        ) or fragment("? LIKE ? ESCAPE '!'", entry.normalized_title, ^title_prefix),
      select: item.node_id,
      order_by: [
        desc: entry.normalized_title == ^normalized_title,
        desc: fragment("? LIKE ? ESCAPE '!'", entry.normalized_title, ^title_prefix),
        desc:
          fragment(
            "ts_rank_cd(to_tsvector('public.operately'::regconfig, coalesce(?, '')), websearch_to_tsquery('public.operately'::regconfig, ?))",
            entry.title,
            ^query
          ),
        desc:
          fragment(
            "ts_rank_cd(to_tsvector('public.operately'::regconfig, coalesce(?, '')), websearch_to_tsquery('public.operately'::regconfig, ?))",
            entry.body,
            ^query
          ),
        asc: entry.source_id
      ],
      limit: @limit
    )
    |> recursive_ctes(true)
    |> with_cte("visible_search_nodes", as: ^visible_nodes)
  end

  defp title_prefix_pattern(title) do
    title
    |> String.replace("!", "!!")
    |> String.replace("%", "!%")
    |> String.replace("_", "!_")
    |> Kernel.<>("%")
  end

  # Eligible items are non-deleted hub resources with current nodes; documents must also be published.
  defp eligible_items_query(hub_id) do
    folder_query =
      from(folder in Folder,
        join: node in assoc(folder, :node),
        where: node.resource_hub_id == ^hub_id,
        where: is_nil(folder.deleted_at) and is_nil(node.deleted_at),
        select: %{
          source_type: type(^"resource_hub_folder", :string),
          source_id: folder.id,
          node_id: node.id
        }
      )

    document_query =
      from(document in Document,
        join: node in assoc(document, :node),
        where: node.resource_hub_id == ^hub_id,
        where: document.state == :published,
        where: is_nil(document.deleted_at) and is_nil(node.deleted_at),
        select: %{
          source_type: type(^"resource_hub_document", :string),
          source_id: document.id,
          node_id: node.id
        }
      )

    file_query =
      from(file in File,
        join: node in assoc(file, :node),
        where: node.resource_hub_id == ^hub_id,
        where: is_nil(file.deleted_at) and is_nil(node.deleted_at),
        select: %{
          source_type: type(^"resource_hub_file", :string),
          source_id: file.id,
          node_id: node.id
        }
      )

    link_query =
      from(link in Link,
        join: node in assoc(link, :node),
        where: node.resource_hub_id == ^hub_id,
        where: is_nil(link.deleted_at) and is_nil(node.deleted_at),
        select: %{
          source_type: type(^"resource_hub_link", :string),
          source_id: link.id,
          node_id: node.id
        }
      )

    folder_query
    |> union_all(^document_query)
    |> union_all(^file_query)
    |> union_all(^link_query)
  end

  # Visible nodes are non-deleted nodes reachable from the hub root through only non-deleted folders.
  defp visible_nodes_query(hub_id) do
    root_nodes =
      from(node in Node,
        where: node.resource_hub_id == ^hub_id,
        where: is_nil(node.parent_folder_id) and is_nil(node.deleted_at),
        select: %{node_id: node.id}
      )

    descendant_nodes =
      from(parent in "visible_search_nodes",
        join: folder in Folder,
        on: folder.node_id == parent.node_id,
        join: child in assoc(folder, :child_nodes),
        where: is_nil(folder.deleted_at) and is_nil(child.deleted_at),
        select: %{node_id: child.id}
      )

    union_all(root_nodes, ^descendant_nodes)
  end

  defp load_nodes([]), do: []

  defp load_nodes(node_ids) do
    nodes_by_id =
      Node
      |> where([node], node.id in ^node_ids)
      |> Node.preload_content()
      |> Repo.all()
      |> Node.load_comments_count()
      |> Folder.set_children_count()
      |> Map.new(&{&1.id, &1})

    Enum.flat_map(node_ids, fn node_id ->
      case Map.fetch(nodes_by_id, node_id) do
        {:ok, node} -> [node]
        :error -> []
      end
    end)
  end
end
