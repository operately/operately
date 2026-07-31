defmodule Operately.Search.Sources.CoreWork.TaskTest do
  use Operately.DataCase, async: true

  alias Operately.Access
  alias Operately.Projects.Project
  alias Operately.Search.Sources.CoreWork.Task, as: TaskSource
  alias Operately.Support.{Factory, RichText}
  alias Operately.Tasks.Task

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_project(:project, :space, goal: :goal)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:project_task, :milestone, name: "Interview customers")
    |> Factory.create_space_task(:space_task, :space, name: "Prepare agenda")
    |> update_task(:project_task, %{description: RichText.rich_text("Research activation blockers")})
    |> update_task(:space_task, %{description: RichText.rich_text("Collect planning topics")})
  end

  test "builds project task entries with inherited project scopes", ctx do
    attrs = entry_attrs(ctx.project_task.id)

    assert attrs.title == "Interview customers"
    assert attrs.body == "Research activation blockers"
    assert attrs.body_kind == "description"
    assert attrs.company_id == ctx.company.id
    assert attrs.access_context_id == Access.get_context!(project_id: ctx.project.id).id
    assert attrs.space_id == ctx.space.id
    assert attrs.project_id == ctx.project.id
    assert attrs.goal_id == ctx.goal.id
    assert attrs.state == nil
  end

  test "builds space task entries without project scopes", ctx do
    attrs = entry_attrs(ctx.space_task.id)

    assert attrs.title == "Prepare agenda"
    assert attrs.body == "Collect planning topics"
    assert attrs.access_context_id == Access.get_context!(group_id: ctx.space.id).id
    assert attrs.space_id == ctx.space.id
    assert attrs.project_id == nil
    assert attrs.goal_id == nil
    assert attrs.state == nil
  end

  test "completed state takes precedence and open project tasks inherit parent state", ctx do
    ctx.project |> Project.changeset(%{status: "paused"}) |> Repo.update!()
    assert entry_attrs(ctx.project_task.id).state == :paused

    completed_status = %{id: "done", label: "Done", color: "green", index: 1, value: "done", closed: true}
    completed = update_task_record(ctx.project_task, %{task_status: completed_status, closed_at: NaiveDateTime.utc_now()})
    assert entry_attrs(completed.id).state == :completed
  end

  test "merges project and space tasks into stable UUID batches and skips deleted owners", ctx do
    {:ok, [first]} = TaskSource.fetch_batch(nil, 1)
    {:ok, remaining} = TaskSource.fetch_batch(first.id, 10)
    assert Enum.all?(remaining, &(&1.id > first.id))

    Repo.soft_delete!(ctx.project)
    assert {:ok, [record]} = TaskSource.fetch_by_ids([ctx.project_task.id])
    assert TaskSource.to_entry(record) == :skip

    Repo.soft_delete!(ctx.space)
    assert {:ok, [record]} = TaskSource.fetch_by_ids([ctx.space_task.id])
    assert TaskSource.to_entry(record) == :skip
  end

  defp update_task(ctx, key, attrs) do
    Map.update!(ctx, key, &update_task_record(&1, attrs))
  end

  defp update_task_record(task, attrs) do
    task |> Task.changeset(attrs) |> Repo.update!()
  end

  defp entry_attrs(id) do
    assert {:ok, [record]} = TaskSource.fetch_by_ids([id])
    assert {:ok, attrs} = TaskSource.to_entry(record)
    attrs
  end
end
