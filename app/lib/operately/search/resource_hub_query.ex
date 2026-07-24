defmodule Operately.Search.ResourceHubQuery do
  @moduledoc """
  Finds full-text results inside an already-authorized resource hub.

  Candidate selection verifies the current resource, node, and folder hierarchy
  before ranking. Folder paths are then loaded in one recursive query for only the
  selected results. Authorization belongs to the API endpoint.
  """

  import Ecto.Query

  alias Operately.Repo
  alias Operately.ResourceHubs.{Document, File, Folder, Link, Node, ResourceHub}
  alias Operately.Search.{Entry, Result, Text}

  @limit 30
  @source_types %{
    resource_hub_folder: :folder_id,
    resource_hub_document: :document_id,
    resource_hub_file: :file_id,
    resource_hub_link: :link_id
  }

  def search(%ResourceHub{} = hub, query) do
    normalized_query = Text.normalize_query(query)

    if String.length(Text.normalize_title(normalized_query)) < 2 do
      []
    else
      hub.id
      |> candidate_query(normalized_query)
      |> Repo.all()
      |> build_results(hub)
    end
  end

  defp candidate_query(hub_id, query) do
    normalized_title = Text.normalize_title(query)
    title_prefix = normalized_title <> "%"
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
        ) or like(entry.normalized_title, ^title_prefix),
      select: %{
        id: entry.source_id,
        type: entry.source_type,
        node_id: item.node_id,
        title: entry.title,
        body_kind: entry.body_kind,
        exact_title: entry.normalized_title == ^normalized_title,
        prefix_title: like(entry.normalized_title, ^title_prefix),
        title_match:
          fragment(
            "to_tsvector('public.operately'::regconfig, coalesce(?, '')) @@ websearch_to_tsquery('public.operately'::regconfig, ?)",
            entry.title,
            ^query
          ),
        title_rank:
          fragment(
            "ts_rank_cd(to_tsvector('public.operately'::regconfig, coalesce(?, '')), websearch_to_tsquery('public.operately'::regconfig, ?))",
            entry.title,
            ^query
          ),
        body_rank:
          fragment(
            "ts_rank_cd(to_tsvector('public.operately'::regconfig, coalesce(?, '')), websearch_to_tsquery('public.operately'::regconfig, ?))",
            entry.body,
            ^query
          ),
        body_snippet:
          fragment(
            "ts_headline('public.operately'::regconfig, coalesce(?, ''), websearch_to_tsquery('public.operately'::regconfig, ?), 'StartSel=__OPERATELY_MATCH_START__, StopSel=__OPERATELY_MATCH_END__, MaxWords=24, MinWords=8, MaxFragments=1, FragmentDelimiter= … ')",
            entry.body,
            ^query
          )
      },
      order_by: [
        desc: entry.normalized_title == ^normalized_title,
        desc: like(entry.normalized_title, ^title_prefix),
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

  defp build_results([], _hub), do: []

  defp build_results(candidates, hub) do
    contexts = load_contexts(candidates, hub.name)

    Enum.map(candidates, fn candidate ->
      title_match? = candidate.exact_title or candidate.prefix_title or candidate.title_match

      %Result{
        id: candidate.id,
        type: candidate.type,
        title: candidate.title,
        context: Map.fetch!(contexts, candidate.node_id),
        matched_field: matched_field(candidate, title_match?),
        snippet: if(title_match?, do: nil, else: sanitize_snippet(candidate.body_snippet)),
        navigation_target: navigation_target(candidate.type, hub.id, candidate.id)
      }
    end)
  end

  defp load_contexts(candidates, hub_name) do
    node_ids = Enum.map(candidates, & &1.node_id)

    rows =
      node_ids
      |> folder_paths_query()
      |> Repo.all()

    folder_names_by_node =
      rows
      |> Enum.reject(&is_nil(&1.folder_name))
      |> Enum.group_by(& &1.root_node_id, & &1.folder_name)

    Map.new(node_ids, fn node_id ->
      folder_names = Map.get(folder_names_by_node, node_id, [])
      {node_id, Enum.join([hub_name | folder_names], " · ")}
    end)
  end

  defp folder_paths_query(node_ids) do
    path_roots =
      from(node in Node,
        where: node.id in ^node_ids and is_nil(node.deleted_at),
        select: %{
          root_node_id: node.id,
          parent_folder_id: node.parent_folder_id,
          folder_name: type(^nil, :string),
          depth: type(^0, :integer)
        }
      )

    ancestors =
      from(path in "search_result_paths",
        join: folder in Folder,
        on: folder.id == path.parent_folder_id,
        join: folder_node in assoc(folder, :node),
        where: is_nil(folder.deleted_at) and is_nil(folder_node.deleted_at),
        select: %{
          root_node_id: path.root_node_id,
          parent_folder_id: folder_node.parent_folder_id,
          folder_name: folder.name,
          depth: path.depth + 1
        }
      )

    path_cte = union_all(path_roots, ^ancestors)

    from(path in "search_result_paths",
      select: %{
        root_node_id: type(path.root_node_id, :binary_id),
        parent_folder_id: type(path.parent_folder_id, :binary_id),
        folder_name: type(path.folder_name, :string),
        depth: type(path.depth, :integer)
      },
      order_by: [asc: path.root_node_id, desc: path.depth]
    )
    |> recursive_ctes(true)
    |> with_cte("search_result_paths", as: ^path_cte)
  end

  defp matched_field(%{type: :resource_hub_document}, true), do: :title
  defp matched_field(_candidate, true), do: :name
  defp matched_field(%{body_kind: "content"}, false), do: :content
  defp matched_field(%{body_kind: "description"}, false), do: :description

  defp sanitize_snippet(snippet) do
    snippet
    |> String.replace("__OPERATELY_MATCH_START__", "")
    |> String.replace("__OPERATELY_MATCH_END__", "")
  end

  defp navigation_target(type, hub_id, source_id) do
    id_field = Map.fetch!(@source_types, type)
    %{id_field => source_id, resource_hub_id: hub_id}
  end
end
