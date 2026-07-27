defmodule Operately.Search.CompanyQuery.ResourceHubItems do
  @moduledoc """
  Builds the canonical resource-hub item set available to company search.

  Search entries are joined to this query so stale projection rows cannot expose
  deleted resources, draft documents, deleted owners, or nodes hidden below a
  deleted folder. The query also supplies current ownership and access metadata,
  allowing company search to reject index rows whose scope has become stale.
  """

  import Ecto.Query

  alias Operately.ResourceHubs.{Document, File, Folder, Link, Node, ResourceHub}

  @visible_nodes_cte "visible_company_search_nodes"

  def visible_nodes_cte, do: @visible_nodes_cte

  @doc """
  Returns current folders, published documents, files, and links for a company.

  Each row includes the node ID, current owner name, and authoritative company,
  access-context, hub, and scope IDs used to validate its search entry. The
  two-argument form restricts work to the supplied accessible-context query.
  """
  def query(company_id), do: query(company_id, nil)

  def query(company_id, accessible_contexts) do
    hubs = eligible_hubs_query(company_id, accessible_contexts)

    folder_query =
      from(folder in Folder,
        join: node in assoc(folder, :node),
        join: hub in subquery(hubs),
        on: hub.resource_hub_id == node.resource_hub_id,
        where: is_nil(folder.deleted_at) and is_nil(node.deleted_at),
        select: %{
          source_type: type(^"resource_hub_folder", :string),
          source_id: folder.id,
          node_id: node.id,
          resource_hub_id: hub.resource_hub_id,
          company_id: hub.company_id,
          access_context_id: hub.access_context_id,
          space_id: hub.space_id,
          project_id: hub.project_id,
          goal_id: hub.goal_id,
          owner_name: hub.owner_name
        }
      )

    document_query =
      from(document in Document,
        join: node in assoc(document, :node),
        join: hub in subquery(hubs),
        on: hub.resource_hub_id == node.resource_hub_id,
        where: document.state == :published,
        where: is_nil(document.deleted_at) and is_nil(node.deleted_at),
        select: %{
          source_type: type(^"resource_hub_document", :string),
          source_id: document.id,
          node_id: node.id,
          resource_hub_id: hub.resource_hub_id,
          company_id: hub.company_id,
          access_context_id: hub.access_context_id,
          space_id: hub.space_id,
          project_id: hub.project_id,
          goal_id: hub.goal_id,
          owner_name: hub.owner_name
        }
      )

    file_query =
      from(file in File,
        join: node in assoc(file, :node),
        join: hub in subquery(hubs),
        on: hub.resource_hub_id == node.resource_hub_id,
        where: is_nil(file.deleted_at) and is_nil(node.deleted_at),
        select: %{
          source_type: type(^"resource_hub_file", :string),
          source_id: file.id,
          node_id: node.id,
          resource_hub_id: hub.resource_hub_id,
          company_id: hub.company_id,
          access_context_id: hub.access_context_id,
          space_id: hub.space_id,
          project_id: hub.project_id,
          goal_id: hub.goal_id,
          owner_name: hub.owner_name
        }
      )

    link_query =
      from(link in Link,
        join: node in assoc(link, :node),
        join: hub in subquery(hubs),
        on: hub.resource_hub_id == node.resource_hub_id,
        where: is_nil(link.deleted_at) and is_nil(node.deleted_at),
        select: %{
          source_type: type(^"resource_hub_link", :string),
          source_id: link.id,
          node_id: node.id,
          resource_hub_id: hub.resource_hub_id,
          company_id: hub.company_id,
          access_context_id: hub.access_context_id,
          space_id: hub.space_id,
          project_id: hub.project_id,
          goal_id: hub.goal_id,
          owner_name: hub.owner_name
        }
      )

    folder_query
    |> union_all(^document_query)
    |> union_all(^file_query)
    |> union_all(^link_query)
  end

  @doc """
  Returns non-deleted nodes reachable from a current company-owned hub root.

  Descendants are included only while every folder in their path still exists and
  is not deleted. The two-argument form starts recursion only from hubs in the
  supplied accessible-context query.
  """
  def visible_nodes_query(company_id), do: visible_nodes_query(company_id, nil)

  def visible_nodes_query(company_id, accessible_contexts) do
    hubs = eligible_hubs_query(company_id, accessible_contexts)

    root_nodes =
      from(node in Node,
        join: hub in subquery(hubs),
        on: hub.resource_hub_id == node.resource_hub_id,
        where: is_nil(node.parent_folder_id) and is_nil(node.deleted_at),
        select: %{node_id: node.id}
      )

    descendant_nodes =
      from(parent in @visible_nodes_cte,
        join: folder in Folder,
        on: folder.node_id == parent.node_id,
        join: child in assoc(folder, :child_nodes),
        where: is_nil(folder.deleted_at) and is_nil(child.deleted_at),
        select: %{node_id: child.id}
      )

    union_all(root_nodes, ^descendant_nodes)
  end

  defp eligible_hubs_query(company_id, accessible_contexts) do
    space_hubs =
      from(hub in ResourceHub,
        join: space in assoc(hub, :space),
        join: context in assoc(space, :access_context),
        where: space.company_id == ^company_id and is_nil(space.deleted_at),
        select: %{
          resource_hub_id: hub.id,
          company_id: space.company_id,
          access_context_id: context.id,
          space_id: space.id,
          project_id: type(^nil, :binary_id),
          goal_id: type(^nil, :binary_id),
          owner_name: space.name
        }
      )

    project_hubs =
      from(hub in ResourceHub,
        join: project in assoc(hub, :project),
        join: context in assoc(project, :access_context),
        where: project.company_id == ^company_id and is_nil(project.deleted_at),
        select: %{
          resource_hub_id: hub.id,
          company_id: project.company_id,
          access_context_id: context.id,
          space_id: project.group_id,
          project_id: project.id,
          goal_id: type(^nil, :binary_id),
          owner_name: project.name
        }
      )

    goal_hubs =
      from(hub in ResourceHub,
        join: goal in assoc(hub, :goal),
        join: context in assoc(goal, :access_context),
        where: goal.company_id == ^company_id and is_nil(goal.deleted_at),
        select: %{
          resource_hub_id: hub.id,
          company_id: goal.company_id,
          access_context_id: context.id,
          space_id: goal.group_id,
          project_id: type(^nil, :binary_id),
          goal_id: goal.id,
          owner_name: goal.name
        }
      )

    hubs =
      space_hubs
      |> union_all(^project_hubs)
      |> union_all(^goal_hubs)

    restrict_to_accessible_contexts(hubs, accessible_contexts)
  end

  defp restrict_to_accessible_contexts(hubs, nil), do: hubs

  defp restrict_to_accessible_contexts(hubs, accessible_contexts) do
    from(hub in subquery(hubs),
      join: context in subquery(accessible_contexts),
      on: context.id == hub.access_context_id,
      select: hub
    )
  end
end
