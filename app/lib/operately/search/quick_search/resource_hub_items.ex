defmodule Operately.Search.QuickSearch.ResourceHubItems do
  @moduledoc """
  Searches visible resource-hub item names for company quick navigation.
  """

  import Ecto.Query
  import Operately.Access.Filters, only: [filter_by_view_access: 3]

  alias Operately.People.Person
  alias Operately.Repo
  alias Operately.ResourceHubs.{Document, File, Folder, Link, Node, ResourceHub}
  alias Operately.Search.Text

  @limit 5
  @visible_nodes_cte "quick_search_visible_resource_nodes"

  def search(%Person{} = person, search_term) do
    search_term = Text.normalize_search_term(search_term)

    person
    |> matching_items_query(search_term)
    |> Repo.all()
    |> build_results()
  end

  defp matching_items_query(person, search_term) do
    visible_nodes = visible_nodes_query(person)

    folder_matches =
      from(folder in Folder,
        join: node in assoc(folder, :node),
        join: visible_node in @visible_nodes_cte,
        on: visible_node.node_id == node.id,
        where: is_nil(folder.deleted_at),
        where: ^name_matches(:name, search_term),
        select: %{
          source_type: type(^"folder", :string),
          id: folder.id,
          name: folder.name,
          context: visible_node.owner_name,
          search_rank:
            fragment(
              "POSITION(LOWER(?) IN regexp_replace(regexp_replace(LOWER(?), '[-_]', ' ', 'g'), ' +', ' ', 'g'))",
              ^search_term,
              folder.name
            )
        }
      )

    document_matches =
      from(document in Document,
        join: node in assoc(document, :node),
        join: visible_node in @visible_nodes_cte,
        on: visible_node.node_id == node.id,
        where: document.state == :published,
        where: is_nil(document.deleted_at),
        where: ^name_matches(:name, search_term),
        select: %{
          source_type: type(^"document", :string),
          id: document.id,
          name: document.name,
          context: visible_node.owner_name,
          search_rank:
            fragment(
              "POSITION(LOWER(?) IN regexp_replace(regexp_replace(LOWER(?), '[-_]', ' ', 'g'), ' +', ' ', 'g'))",
              ^search_term,
              document.name
            )
        }
      )

    file_matches =
      from(file in File,
        join: node in assoc(file, :node),
        join: visible_node in @visible_nodes_cte,
        on: visible_node.node_id == node.id,
        where: is_nil(file.deleted_at),
        where: ^name_matches(:name, search_term),
        select: %{
          source_type: type(^"file", :string),
          id: file.id,
          name: file.name,
          context: visible_node.owner_name,
          search_rank:
            fragment(
              "POSITION(LOWER(?) IN regexp_replace(regexp_replace(LOWER(?), '[-_]', ' ', 'g'), ' +', ' ', 'g'))",
              ^search_term,
              file.name
            )
        }
      )

    link_matches =
      from(link in Link,
        join: node in assoc(link, :node),
        join: visible_node in @visible_nodes_cte,
        on: visible_node.node_id == node.id,
        where: is_nil(link.deleted_at),
        where: ^name_matches(:name, search_term),
        select: %{
          source_type: type(^"link", :string),
          id: link.id,
          name: link.name,
          context: visible_node.owner_name,
          search_rank:
            fragment(
              "POSITION(LOWER(?) IN regexp_replace(regexp_replace(LOWER(?), '[-_]', ' ', 'g'), ' +', ' ', 'g'))",
              ^search_term,
              link.name
            )
        }
      )

    combined_matches =
      folder_matches
      |> union_all(^document_matches)
      |> union_all(^file_matches)
      |> union_all(^link_matches)

    ranked_matches =
      from(item in subquery(combined_matches),
        windows: [
          source_type: [
            partition_by: item.source_type,
            order_by: [asc: item.search_rank, asc: item.id]
          ]
        ],
        select: %{
          source_type: item.source_type,
          id: item.id,
          name: item.name,
          context: item.context,
          search_rank: item.search_rank,
          result_rank: over(row_number(), :source_type)
        }
      )

    from(item in subquery(ranked_matches),
      where: item.result_rank <= @limit,
      select: %{
        source_type: item.source_type,
        id: item.id,
        name: item.name,
        context: item.context,
        search_rank: item.search_rank
      }
    )
    |> recursive_ctes(true)
    |> with_cte(@visible_nodes_cte, as: ^visible_nodes)
  end

  defp visible_nodes_query(person) do
    eligible_hubs = eligible_hubs_query(person)

    root_nodes =
      from(node in Node,
        join: hub in subquery(eligible_hubs),
        on: hub.resource_hub_id == node.resource_hub_id,
        where: is_nil(node.parent_folder_id),
        where: is_nil(node.deleted_at),
        select: %{
          node_id: node.id,
          resource_hub_id: node.resource_hub_id,
          owner_name: hub.owner_name
        }
      )

    descendant_nodes =
      from(parent in @visible_nodes_cte,
        join: folder in Folder,
        on: folder.node_id == parent.node_id,
        join: child in assoc(folder, :child_nodes),
        where: is_nil(folder.deleted_at),
        where: is_nil(child.deleted_at),
        where: child.resource_hub_id == parent.resource_hub_id,
        select: %{
          node_id: child.id,
          resource_hub_id: parent.resource_hub_id,
          owner_name: parent.owner_name
        }
      )

    union_all(root_nodes, ^descendant_nodes)
  end

  defp eligible_hubs_query(person) do
    space_hubs =
      from(hub in ResourceHub,
        join: space in assoc(hub, :space),
        as: :space,
        where: space.company_id == ^person.company_id,
        where: is_nil(space.deleted_at)
      )
      |> filter_by_view_access(person.id, named_binding: :space)
      |> select([hub, space: space], %{
        resource_hub_id: hub.id,
        owner_name: space.name
      })

    project_hubs =
      from(hub in ResourceHub,
        join: project in assoc(hub, :project),
        as: :project,
        join: space in assoc(project, :group),
        where: project.company_id == ^person.company_id,
        where: project.status != "closed",
        where: is_nil(project.deleted_at),
        where: is_nil(space.deleted_at)
      )
      |> filter_by_view_access(person.id, named_binding: :project)
      |> select([hub, project: project], %{
        resource_hub_id: hub.id,
        owner_name: project.name
      })

    goal_hubs =
      from(hub in ResourceHub,
        join: goal in assoc(hub, :goal),
        as: :goal,
        join: space in assoc(goal, :group),
        where: goal.company_id == ^person.company_id,
        where: is_nil(goal.closed_at),
        where: is_nil(goal.deleted_at),
        where: is_nil(space.deleted_at)
      )
      |> filter_by_view_access(person.id, named_binding: :goal)
      |> select([hub, goal: goal], %{
        resource_hub_id: hub.id,
        owner_name: goal.name
      })

    space_hubs
    |> union_all(^project_hubs)
    |> union_all(^goal_hubs)
  end

  defp name_matches(field_name, search_term) do
    dynamic(
      [item],
      fragment(
        "regexp_replace(regexp_replace(LOWER(?), '[-_]', ' ', 'g'), ' +', ' ', 'g') LIKE ?",
        field(item, ^field_name),
        ^match_pattern(search_term)
      )
    )
  end

  defp build_results(items) do
    grouped_items =
      items
      |> Enum.sort_by(&{&1.search_rank, &1.id})
      |> Enum.group_by(& &1.source_type, &Map.drop(&1, [:source_type, :search_rank]))

    %{
      folders: Map.get(grouped_items, "folder", []),
      documents: Map.get(grouped_items, "document", []),
      files: Map.get(grouped_items, "file", []),
      links: Map.get(grouped_items, "link", [])
    }
  end

  defp match_pattern(search_term), do: "%#{String.downcase(search_term)}%"
end
