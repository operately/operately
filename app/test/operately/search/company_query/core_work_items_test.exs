defmodule Operately.Search.CompanyQuery.CoreWorkItemsTest do
  use Operately.DataCase

  alias Operately.Search.CompanyQuery.CoreWorkItems
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, name: "Product")
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_project(:project, :space, goal: :goal)
    |> Factory.add_messages_board(:board, :space)
    |> Factory.add_message(:discussion, :board)
  end

  test "returns authoritative metadata for projects, goals, and discussions", ctx do
    items = Repo.all(CoreWorkItems.query(ctx.company.id), with_deleted: true)
    items_by_type = Map.new(items, &{&1.source_type, &1})

    assert %{
             source_id: project_id,
             owner_name: "Product",
             space_id: space_id,
             project_id: project_id,
             goal_id: goal_id
           } = items_by_type["project"]

    assert project_id == ctx.project.id
    assert space_id == ctx.space.id
    assert goal_id == ctx.goal.id

    assert %{source_id: goal_id, project_id: nil, goal_id: goal_id} = items_by_type["goal"]
    assert goal_id == ctx.goal.id

    assert %{source_id: discussion_id, project_id: nil, goal_id: nil} = items_by_type["discussion"]
    assert discussion_id == ctx.discussion.id
  end

  test "includes archived projects and published discussions while excluding deleted goals and unpublished discussions", ctx do
    Repo.soft_delete!(ctx.project)
    Repo.soft_delete!(ctx.discussion)
    Repo.soft_delete!(ctx.goal)

    draft = Factory.add_message(ctx, :draft, :board, state: :draft).draft
    scheduled = Factory.add_message(ctx, :scheduled, :board, state: :scheduled).scheduled

    result_ids =
      CoreWorkItems.query(ctx.company.id)
      |> Repo.all(with_deleted: true)
      |> Enum.map(& &1.source_id)

    assert ctx.project.id in result_ids
    assert ctx.discussion.id in result_ids
    refute ctx.goal.id in result_ids
    refute draft.id in result_ids
    refute scheduled.id in result_ids
  end

  test "excludes every source when its owning space is deleted", ctx do
    Repo.soft_delete!(ctx.space)
    assert Repo.all(CoreWorkItems.query(ctx.company.id), with_deleted: true) == []
  end
end
