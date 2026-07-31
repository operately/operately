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
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:project_task, :milestone)
    |> Factory.create_space_task(:space_task, :space)
    |> Factory.add_company_member(:teammate, name: "Taylor Reed", title: "VP of Product")
    |> Factory.add_messages_board(:board, :space)
    |> Factory.add_message(:discussion, :board)
    |> Factory.add_project_check_in(:project_check_in, :project, :creator)
    |> Factory.add_goal_update(:goal_check_in, :goal, :creator)
    |> Factory.add_project_retrospective(:retrospective, :project, :creator)
  end

  test "returns authoritative metadata for core work", ctx do
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

    assert %{
             owner_name: project_name,
             space_id: space_id,
             project_id: project_id,
             goal_id: goal_id,
             expected_state: nil
           } = Enum.find(items, &(&1.source_id == ctx.milestone.id))

    assert project_name == ctx.project.name
    assert space_id == ctx.space.id
    assert project_id == ctx.project.id
    assert goal_id == ctx.goal.id

    assert %{owner_name: project_name, project_id: project_id, goal_id: goal_id} =
             Enum.find(items, &(&1.source_id == ctx.project_task.id))

    assert project_name == ctx.project.name
    assert project_id == ctx.project.id
    assert goal_id == ctx.goal.id

    assert %{owner_name: "Product", project_id: nil, goal_id: nil} =
             Enum.find(items, &(&1.source_id == ctx.space_task.id))

    assert %{owner_name: company_name, space_id: nil, project_id: nil, goal_id: nil} =
             Enum.find(items, &(&1.source_id == ctx.teammate.id))

    assert company_name == ctx.company.name

    assert %{source_id: goal_id, project_id: nil, goal_id: goal_id} = items_by_type["goal"]
    assert goal_id == ctx.goal.id

    assert %{source_id: discussion_id, project_id: nil, goal_id: nil} = items_by_type["discussion"]
    assert discussion_id == ctx.discussion.id

    assert %{
             source_id: project_check_in_id,
             owner_name: project_name,
             space_id: space_id,
             project_id: project_id,
             goal_id: goal_id,
             expected_state: nil
           } = items_by_type["project_check_in"]

    assert project_check_in_id == ctx.project_check_in.id
    assert project_name == ctx.project.name
    assert space_id == ctx.space.id
    assert project_id == ctx.project.id
    assert goal_id == ctx.goal.id

    assert %{
             source_id: goal_check_in_id,
             owner_name: goal_name,
             project_id: nil,
             goal_id: goal_id,
             expected_state: nil
           } = items_by_type["goal_check_in"]

    assert goal_check_in_id == ctx.goal_check_in.id
    assert goal_name == ctx.goal.name
    assert goal_id == ctx.goal.id

    assert %{
             source_id: retrospective_id,
             owner_name: retrospective_project_name,
             project_id: retrospective_project_id,
             goal_id: retrospective_goal_id
           } = items_by_type["project_retrospective"]

    assert retrospective_id == ctx.retrospective.id
    assert retrospective_project_name == ctx.project.name
    assert retrospective_project_id == ctx.project.id
    assert retrospective_goal_id == ctx.goal.id
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

    assert ctx.company.id
           |> CoreWorkItems.query()
           |> Repo.all(with_deleted: true)
           |> Enum.all?(&(&1.source_type == "person"))
  end

  test "computes expected_state from live parent status", ctx do
    ctx.project |> Ecto.Changeset.change(status: "paused") |> Repo.update!()

    items = parent_owned_items(ctx.company.id)

    assert items["project_check_in"].expected_state == "paused"
    assert items["project_retrospective"].expected_state == "paused"
    assert items["goal_check_in"].expected_state == nil

    ctx.project
    |> Ecto.Changeset.change(status: "closed", closed_at: DateTime.utc_now(:second))
    |> Repo.update!()

    ctx.goal |> Ecto.Changeset.change(closed_at: DateTime.utc_now(:second)) |> Repo.update!()

    items = parent_owned_items(ctx.company.id)

    assert items["project_check_in"].expected_state == "closed"
    assert items["project_retrospective"].expected_state == "closed"
    assert items["goal_check_in"].expected_state == "closed"
  end

  test "computes completed and inherited states for milestones and tasks", ctx do
    ctx.project |> Ecto.Changeset.change(status: "paused") |> Repo.update!()

    items = core_items_by_id(ctx.company.id)
    assert items[ctx.milestone.id].expected_state == "paused"
    assert items[ctx.project_task.id].expected_state == "paused"
    assert items[ctx.space_task.id].expected_state == nil

    ctx.milestone |> Ecto.Changeset.change(status: :done, completed_at: NaiveDateTime.utc_now(:second)) |> Repo.update!()
    completed_status = %{id: "done", label: "Done", color: "green", index: 1, value: "done", closed: true}
    ctx.project_task |> Operately.Tasks.Task.changeset(%{task_status: completed_status}) |> Repo.update!()

    items = core_items_by_id(ctx.company.id)
    assert items[ctx.milestone.id].expected_state == "completed"
    assert items[ctx.project_task.id].expected_state == "completed"
  end

  test "excludes archived owners, deleted milestones, and suspended people", ctx do
    Repo.soft_delete!(ctx.milestone)
    ctx.teammate |> Ecto.Changeset.change(suspended: true, suspended_at: DateTime.utc_now(:second)) |> Repo.update!()

    result_ids = ctx.company.id |> CoreWorkItems.query() |> Repo.all(with_deleted: true) |> Enum.map(& &1.source_id)

    refute ctx.milestone.id in result_ids
    refute ctx.teammate.id in result_ids

    Repo.soft_delete!(ctx.project)
    result_ids = ctx.company.id |> CoreWorkItems.query() |> Repo.all(with_deleted: true) |> Enum.map(& &1.source_id)
    refute ctx.project_task.id in result_ids
  end

  test "includes closed parents and excludes unpublished check-ins and deleted parents", ctx do
    ctx.project
    |> Ecto.Changeset.change(status: "closed", closed_at: DateTime.utc_now(:second))
    |> Repo.update!()

    ctx.goal
    |> Ecto.Changeset.change(closed_at: DateTime.utc_now(:second))
    |> Repo.update!()

    ctx.project_check_in |> Ecto.Changeset.change(state: :draft) |> Repo.update!()
    ctx.goal_check_in |> Ecto.Changeset.change(state: :scheduled) |> Repo.update!()

    items =
      ctx.company.id
      |> CoreWorkItems.query()
      |> Repo.all(with_deleted: true)
      |> Enum.filter(&(&1.source_type in ["project_check_in", "goal_check_in", "project_retrospective"]))

    assert [%{source_type: "project_retrospective", expected_state: "closed"}] = items

    Repo.soft_delete!(ctx.project)
    Repo.soft_delete!(ctx.goal)

    remaining_parent_owned_items =
      ctx.company.id
      |> CoreWorkItems.query()
      |> Repo.all(with_deleted: true)
      |> Enum.filter(&(&1.source_type in ["project_check_in", "goal_check_in", "project_retrospective"]))

    assert remaining_parent_owned_items == []
  end

  defp parent_owned_items(company_id) do
    company_id
    |> CoreWorkItems.query()
    |> Repo.all(with_deleted: true)
    |> Enum.filter(&(&1.source_type in ["project_check_in", "goal_check_in", "project_retrospective"]))
    |> Map.new(&{&1.source_type, &1})
  end

  defp core_items_by_id(company_id) do
    company_id
    |> CoreWorkItems.query()
    |> Repo.all(with_deleted: true)
    |> Map.new(&{&1.source_id, &1})
  end
end
