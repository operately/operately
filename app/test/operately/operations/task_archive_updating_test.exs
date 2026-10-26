defmodule Operately.Operations.TaskArchiveUpdatingTest do
  use Operately.DataCase

  alias Operately.Activities.Activity
  alias Operately.Operations.TaskArchiveUpdating
  alias Operately.Tasks.Task

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:task, :milestone)
    |> Factory.preload(:task, :project)
  end

  describe "archiving" do
    test "archives a closed task without changing its other attributes", ctx do
      task = close_task(ctx.task, ctx.project.task_statuses)

      assert {:ok, archived} = TaskArchiveUpdating.run(ctx.creator, task, true)
      assert %NaiveDateTime{} = archived.archived_at
      assert Repo.reload!(task).archived_at == archived.archived_at
      assert_task_attributes_preserved(task, archived)
    end

    test "records the author and project context in the activity", ctx do
      task = close_task(ctx.task, ctx.project.task_statuses)

      assert {:ok, _} = TaskArchiveUpdating.run(ctx.creator, task, true)
      assert [activity] = archive_activities(task)
      assert activity.author_id == ctx.creator.id
      assert activity.content["company_id"] == ctx.company.id
      assert activity.content["space_id"] == ctx.space.id
      assert activity.content["project_id"] == ctx.project.id
      assert activity.content["task_id"] == task.id
      assert activity.content["name"] == task.name
      assert activity.content["archived"] == true
    end

    test "supports custom closed statuses on space tasks", ctx do
      ctx = Factory.create_space_task(ctx, :space_task, :space)
      status = %{id: "custom", label: "Finished", value: "finished", color: :green, index: 4, closed: true}
      task = set_status(ctx.space_task, status)

      assert {:ok, archived} = TaskArchiveUpdating.run(ctx.creator, task, true)
      assert archived.archived_at
      assert_task_attributes_preserved(task, archived)
      assert [activity] = archive_activities(task)
      assert activity.content["space_id"] == ctx.space.id
      assert is_nil(activity.content["project_id"])
      assert activity.content["task_id"] == task.id
    end

    test "rejects open tasks without changing the task or recording an activity", ctx do
      assert {:error, :bad_request} = TaskArchiveUpdating.run(ctx.creator, ctx.task, true)
      assert is_nil(Repo.reload!(ctx.task).archived_at)
      assert_task_attributes_preserved(ctx.task, Repo.reload!(ctx.task))
      assert archive_activities(ctx.task) == []
    end

    test "rejects tasks without a status", ctx do
      task = ctx.task |> Ecto.Changeset.change() |> Ecto.Changeset.put_embed(:task_status, nil) |> Repo.update!()

      assert {:error, :bad_request} = TaskArchiveUpdating.run(ctx.creator, task, true)
      assert is_nil(Repo.reload!(task).archived_at)
      assert archive_activities(task) == []
    end

    test "validates the persisted status when given a stale closed task", ctx do
      task = close_task(ctx.task, ctx.project.task_statuses)
      set_status(task, ctx.task.task_status)

      assert {:error, :bad_request} = TaskArchiveUpdating.run(ctx.creator, task, true)
      assert is_nil(Repo.reload!(task).archived_at)
      assert archive_activities(task) == []
    end

    test "uses the persisted status when given a stale open task", ctx do
      close_task(ctx.task, ctx.project.task_statuses)

      assert {:ok, archived} = TaskArchiveUpdating.run(ctx.creator, ctx.task, true)
      assert archived.archived_at
      assert archived.task_status.closed
    end

    test "repeated requests with a stale task preserve the timestamp and create only one activity", ctx do
      task = close_task(ctx.task, ctx.project.task_statuses)
      archived_at = ~N[2026-01-01 12:00:00]

      assert {:ok, _} = TaskArchiveUpdating.run(ctx.creator, task, true)
      task |> Ecto.Changeset.change(archived_at: archived_at) |> Repo.update!()

      assert {:ok, archived} = TaskArchiveUpdating.run(ctx.creator, task, true)
      assert archived.archived_at == archived_at
      assert Repo.reload!(task).archived_at == archived_at
      assert [_activity] = archive_activities(task)
    end
  end

  describe "restoring" do
    test "restores a task without changing its other attributes and records an activity", ctx do
      task = close_task(ctx.task, ctx.project.task_statuses)
      assert {:ok, archived} = TaskArchiveUpdating.run(ctx.creator, task, true)

      assert {:ok, restored} = TaskArchiveUpdating.run(ctx.creator, Repo.preload(archived, :project), false)
      assert is_nil(restored.archived_at)
      assert is_nil(Repo.reload!(task).archived_at)
      assert_task_attributes_preserved(task, restored)

      activities = archive_activities(task)
      assert length(activities) == 2
      activity = Enum.find(activities, &(&1.content["archived"] == false))
      assert activity.author_id == ctx.creator.id
      assert activity.content["task_id"] == task.id
      assert activity.content["project_id"] == ctx.project.id
    end

    test "repeated requests with a stale archived task create only one restore activity", ctx do
      task = close_task(ctx.task, ctx.project.task_statuses)
      task = task |> Ecto.Changeset.change(archived_at: ~N[2026-01-01 12:00:00]) |> Repo.update!()

      assert {:ok, _} = TaskArchiveUpdating.run(ctx.creator, task, false)
      assert {:ok, restored} = TaskArchiveUpdating.run(ctx.creator, task, false)
      assert is_nil(restored.archived_at)
      assert [activity] = archive_activities(task)
      assert activity.content["archived"] == false
    end

    test "restoring an active task does not create an activity", ctx do
      assert {:ok, task} = TaskArchiveUpdating.run(ctx.creator, ctx.task, false)
      assert is_nil(task.archived_at)
      assert archive_activities(task) == []
    end
  end

  defp close_task(task, statuses), do: set_status(task, Enum.find(statuses, & &1.closed))

  defp set_status(task, status) do
    {:ok, task} = Operately.Tasks.update_task(task, Task.status_change_attrs(task, status))
    task
  end

  defp assert_task_attributes_preserved(before, after_task) do
    fields = Task.__schema__(:fields) -- [:archived_at, :updated_at]
    assert Map.take(after_task, fields) == Map.take(before, fields)
  end

  defp archive_activities(task) do
    from(a in Activity, where: a.action == "task_archive_updating" and a.content["task_id"] == ^task.id)
    |> Repo.all()
  end
end
