defmodule Operately.Search.CompanyQuery.ResourceHubItemsTest do
  use Operately.DataCase

  alias Operately.Search.CompanyQuery.ResourceHubItems
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space, name: "Knowledge")
      |> Factory.add_project(:project, :space, name: "Website")
      |> Factory.add_goal(:goal, :space, name: "Expansion")
      |> Factory.add_resource_hub(:space_hub, :space, :creator)
      |> Factory.add_resource_hub(:project_hub, :project, :creator)
      |> Factory.add_resource_hub(:goal_hub, :goal, :creator)
      |> Factory.add_folder(:parent, :space_hub)
      |> Factory.add_document(:document, :space_hub, folder: :parent)
      |> Factory.add_file(:resource_file, :project_hub)
      |> Factory.add_link(:link, :goal_hub)

    ctx
  end

  test "returns current source and owner metadata for all supported items", ctx do
    items = Repo.all(ResourceHubItems.query(ctx.company.id))
    items_by_id = Map.new(items, &{&1.source_id, &1})

    assert items_by_id[ctx.parent.id].owner_name == "Knowledge"
    assert items_by_id[ctx.document.id].source_type == "resource_hub_document"
    assert items_by_id[ctx.document.id].access_context_id == Operately.Access.get_context!(group_id: ctx.space.id).id

    assert %{
             owner_name: "Website",
             resource_hub_id: project_hub_id,
             project_id: project_id,
             space_id: space_id
           } = items_by_id[ctx.resource_file.id]

    assert project_hub_id == ctx.project_hub.id
    assert project_id == ctx.project.id
    assert space_id == ctx.space.id

    assert %{owner_name: "Expansion", goal_id: goal_id} = items_by_id[ctx.link.id]
    assert goal_id == ctx.goal.id
  end

  test "excludes drafts, deleted resources, deleted nodes, and deleted owners", ctx do
    draft = ctx.document |> Ecto.Changeset.change(state: :draft) |> Repo.update!()
    Repo.soft_delete!(ctx.resource_file)
    ctx.link |> Repo.preload(:node) |> Map.fetch!(:node) |> Repo.soft_delete!()
    Repo.soft_delete!(ctx.project)

    result_ids = ResourceHubItems.query(ctx.company.id) |> Repo.all() |> Enum.map(& &1.source_id)

    refute draft.id in result_ids
    refute ctx.resource_file.id in result_ids
    refute ctx.link.id in result_ids
  end

  test "visible nodes exclude descendants below a deleted folder", ctx do
    Repo.soft_delete!(ctx.parent)

    query =
      from(item in subquery(ResourceHubItems.query(ctx.company.id)),
        join: visible in "visible_company_search_nodes",
        on: visible.node_id == item.node_id,
        select: item.source_id
      )
      |> recursive_ctes(true)
      |> with_cte("visible_company_search_nodes", as: ^ResourceHubItems.visible_nodes_query(ctx.company.id))

    visible_ids = Repo.all(query)

    refute ctx.parent.id in visible_ids
    refute ctx.document.id in visible_ids
  end

  test "items and visible nodes include only hubs in the accessible-context query", ctx do
    space_context = Operately.Access.get_context!(group_id: ctx.space.id)

    accessible_contexts =
      from(context in Operately.Access.Context,
        where: context.id == ^space_context.id,
        select: %{id: context.id}
      )

    visible_nodes = ResourceHubItems.visible_nodes_query(ctx.company.id, accessible_contexts)
    accessible_item_ids = ResourceHubItems.query(ctx.company.id, accessible_contexts) |> Repo.all() |> Enum.map(& &1.source_id)

    visible_node_ids =
      from(node in "visible_company_search_nodes", select: type(node.node_id, :binary_id))
      |> recursive_ctes(true)
      |> with_cte("visible_company_search_nodes", as: ^visible_nodes)
      |> Repo.all()

    assert ctx.parent.id in accessible_item_ids
    assert ctx.document.id in accessible_item_ids
    refute ctx.resource_file.id in accessible_item_ids
    refute ctx.link.id in accessible_item_ids

    assert ctx.parent.node_id in visible_node_ids
    assert ctx.document.node_id in visible_node_ids
    refute ctx.resource_file.node_id in visible_node_ids
    refute ctx.link.node_id in visible_node_ids
  end
end
