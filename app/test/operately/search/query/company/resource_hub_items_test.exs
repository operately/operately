defmodule Operately.Search.Query.Company.ResourceHubItemsTest do
  use Operately.DataCase

  alias Operately.Search.Query.Company.ResourceHubItems
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

  test "ancestor paths walk only supplied candidates and accept root and nested candidates", ctx do
    candidates =
      from(item in subquery(ResourceHubItems.query(ctx.company.id)),
        where: item.source_id in ^[ctx.document.id, ctx.resource_file.id],
        select: %{
          entry_id: item.source_id,
          resource_hub_id: item.resource_hub_id,
          parent_folder_id: item.parent_folder_id
        }
      )

    root_entry_ids = root_entry_ids(ResourceHubItems.ancestor_paths_query(candidates))

    assert MapSet.new(root_entry_ids) == MapSet.new([ctx.document.id, ctx.resource_file.id])
    refute ctx.link.id in root_entry_ids
  end

  test "ancestor paths reject deleted or missing ancestors", ctx do
    candidates =
      from(item in subquery(ResourceHubItems.query(ctx.company.id)),
        where: item.source_id == ^ctx.document.id,
        select: %{
          entry_id: item.source_id,
          resource_hub_id: item.resource_hub_id,
          parent_folder_id: item.parent_folder_id
        }
      )

    Repo.soft_delete!(ctx.parent)
    assert root_entry_ids(ResourceHubItems.ancestor_paths_query(candidates)) == []

    missing_parent_id = Ecto.UUID.generate()

    missing_parent_candidates =
      from(item in subquery(ResourceHubItems.query(ctx.company.id)),
        where: item.source_id == ^ctx.resource_file.id,
        select: %{
          entry_id: item.source_id,
          resource_hub_id: item.resource_hub_id,
          parent_folder_id: type(^missing_parent_id, :binary_id)
        }
      )

    assert root_entry_ids(ResourceHubItems.ancestor_paths_query(missing_parent_candidates)) == []
  end

  test "ancestor paths reject parent folders from another resource hub", ctx do
    ctx =
      ctx
      |> Factory.add_project(:other_project, :space)
      |> Factory.add_resource_hub(:other_hub, :other_project, :creator)
      |> Factory.add_folder(:other_parent, :other_hub)

    Operately.ResourceHubs.Node
    |> Repo.get!(ctx.document.node_id)
    |> Operately.ResourceHubs.Node.changeset(%{parent_folder_id: ctx.other_parent.id})
    |> Repo.update!()

    candidates =
      from(item in subquery(ResourceHubItems.query(ctx.company.id)),
        where: item.source_id == ^ctx.document.id,
        select: %{
          entry_id: item.source_id,
          resource_hub_id: item.resource_hub_id,
          parent_folder_id: item.parent_folder_id
        }
      )

    assert root_entry_ids(ResourceHubItems.ancestor_paths_query(candidates)) == []
  end

  defp root_entry_ids(ancestor_paths) do
    ancestor_paths_cte = ResourceHubItems.candidate_ancestors_cte()

    from(path in "company_search_candidate_ancestors",
      where: is_nil(path.parent_folder_id),
      select: type(path.entry_id, :binary_id)
    )
    |> recursive_ctes(true)
    |> with_cte(^ancestor_paths_cte, as: ^ancestor_paths)
    |> Repo.all()
  end
end
