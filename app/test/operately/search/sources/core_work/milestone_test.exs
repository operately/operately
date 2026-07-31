defmodule Operately.Search.Sources.CoreWork.MilestoneTest do
  use Operately.DataCase, async: true

  alias Operately.Access
  alias Operately.Projects.{Milestone, Project}
  alias Operately.Search.Sources.CoreWork.Milestone, as: MilestoneSource
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_project(:project, :space, goal: :goal)
    |> Factory.add_project_milestone(:milestone, :project)
    |> update_milestone(%{title: "Launch beta", description: RichText.rich_text("Validate onboarding")})
  end

  test "builds milestone entries with inherited scopes and plain-text description", ctx do
    attrs = entry_attrs(ctx.milestone.id)

    assert attrs.title == "Launch beta"
    assert attrs.body == "Validate onboarding"
    assert attrs.body_kind == "description"
    assert attrs.company_id == ctx.company.id
    assert attrs.access_context_id == Access.get_context!(project_id: ctx.project.id).id
    assert attrs.space_id == ctx.space.id
    assert attrs.project_id == ctx.project.id
    assert attrs.goal_id == ctx.goal.id
    assert attrs.state == nil
    assert attrs.source_inserted_at == ctx.milestone.inserted_at
    assert NaiveDateTime.compare(attrs.source_updated_at, ctx.milestone.updated_at) in [:eq, :gt]
  end

  test "completed state takes precedence over inherited project state", ctx do
    paused_project = update_project(ctx.project, %{status: "paused"})
    assert entry_attrs(ctx.milestone.id).state == :paused

    completed = update_milestone_record(ctx.milestone, %{status: :done, completed_at: NaiveDateTime.utc_now()})
    assert entry_attrs(completed.id).state == :completed

    update_project(paused_project, %{status: "closed", closed_at: NaiveDateTime.utc_now()})
    assert entry_attrs(completed.id).state == :completed
  end

  test "uses stable UUID batches and skips deleted milestones and archived parents", ctx do
    {:ok, [first]} = MilestoneSource.fetch_batch(nil, 1)
    {:ok, remaining} = MilestoneSource.fetch_batch(first.id, 10)
    assert Enum.all?(remaining, &(&1.id > first.id))

    Repo.soft_delete!(ctx.milestone)
    assert {:ok, [record]} = MilestoneSource.fetch_by_ids([ctx.milestone.id])
    assert MilestoneSource.to_entry(record) == :skip

    restored = ctx.milestone |> Repo.reload!(with_deleted: true) |> Ecto.Changeset.change(deleted_at: nil) |> Repo.update!()
    Repo.soft_delete!(ctx.project)
    assert {:ok, [record]} = MilestoneSource.fetch_by_ids([restored.id])
    assert MilestoneSource.to_entry(record) == :skip
  end

  defp update_milestone(ctx, attrs) do
    Map.put(ctx, :milestone, update_milestone_record(ctx.milestone, attrs))
  end

  defp update_milestone_record(milestone, attrs) do
    milestone |> Milestone.changeset(attrs) |> Repo.update!()
  end

  defp update_project(project, attrs) do
    project |> Project.changeset(attrs) |> Repo.update!()
  end

  defp entry_attrs(id) do
    assert {:ok, [record]} = MilestoneSource.fetch_by_ids([id])
    assert {:ok, attrs} = MilestoneSource.to_entry(record)
    attrs
  end
end
