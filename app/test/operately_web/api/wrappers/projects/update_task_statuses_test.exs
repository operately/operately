defmodule OperatelyWeb.Api.Wrappers.Projects.UpdateTaskStatusesTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:engineering)
    |> Factory.add_project(:project, :engineering)
    |> Factory.add_project_milestone(:milestone, :project)
  end

  describe "update task statuses" do
    test "deletes an unused status without a replacement", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      [removed | remaining] = Operately.Projects.Project.task_statuses(ctx.project)

      topic = "api:project_updated:#{ctx.project.id}"
      OperatelyWeb.Endpoint.subscribe(topic)

      assert {200, response} =
               mutation(ctx.conn, [:projects, :update_task_statuses], %{
                 project_id: Paths.project_id(ctx.project),
                 task_statuses: Enum.map(remaining, &(&1 |> Map.from_struct() |> Map.update!(:color, fn color -> to_string(color) end)))
               })

      assert response == %{success: true}
      assert_receive %Phoenix.Socket.Broadcast{topic: ^topic, event: "event"}
      refute_receive %Phoenix.Socket.Broadcast{topic: ^topic, event: "event"}

      refute Enum.any?(Operately.Projects.Project.task_statuses(Repo.reload!(ctx.project)), &(&1.id == removed.id))
    end

    for archived <- [false, true] do
      @archived archived
      test "requires a replacement for an occupied status (archived=#{@archived})", ctx do
        ctx = Factory.log_in_person(ctx, :creator)
        [removed | remaining] = Operately.Projects.Project.task_statuses(ctx.project)
        task_status = Map.from_struct(removed)
        ctx = Factory.add_project_task(ctx, :task, :milestone, task_status: task_status)

        if @archived do
          ctx.task |> Ecto.Changeset.change(archived_at: ~N[2026-01-01 00:00:00]) |> Repo.update!()
        end

        assert {400, _response} =
                 mutation(ctx.conn, [:projects, :update_task_statuses], %{
                   project_id: Paths.project_id(ctx.project),
                   task_statuses: Enum.map(remaining, &(&1 |> Map.from_struct() |> Map.update!(:color, fn color -> to_string(color) end))),
                   deleted_status_replacements: []
                 })

        assert Operately.Projects.Project.task_statuses(Repo.reload!(ctx.project)) == Operately.Projects.Project.task_statuses(ctx.project)
        assert Repo.reload!(ctx.task).task_status == ctx.task.task_status
      end
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :update_task_statuses], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} =
               mutation(ctx.conn, [:projects, :update_task_statuses], %{
                 task_statuses: [
                   %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false}
                 ]
               })

      assert res.message == "Missing required fields: project_id"
    end

    test "it requires at least one task status", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} =
               mutation(ctx.conn, [:projects, :update_task_statuses], %{
                 project_id: Paths.project_id(ctx.project),
                 task_statuses: []
               })

      assert res.message == "At least one task status is required"
    end

    test "it updates task statuses for the project", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "in_progress", label: "In progress", color: "blue", index: 1, value: "in_progress", closed: false},
        %{id: "done", label: "Done", color: "green", index: 2, value: "done", closed: false}
      ]

      assert {200, res} =
               mutation(ctx.conn, [:projects, :update_task_statuses], %{
                 project_id: Paths.project_id(ctx.project),
                 task_statuses: statuses
               })

      assert res.success == true

      project = Repo.reload(ctx.project)

      assert length(Operately.Projects.Project.task_statuses(project)) == 3
      assert Enum.map(Operately.Projects.Project.task_statuses(project), & &1.label) == ["Todo", "In progress", "Done"]
    end

    test "validation fails when replacement status does not exist in new statuses", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Try to delete "old_status" and replace with "nonexistent" which is not in the new statuses list
      new_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "done", label: "Done", color: "green", index: 1, value: "done", closed: true}
      ]

      assert {400, res} =
               mutation(ctx.conn, [:projects, :update_task_statuses], %{
                 project_id: Paths.project_id(ctx.project),
                 task_statuses: new_statuses,
                 deleted_status_replacements: [
                   %{deleted_status_id: "old_status", replacement_status_id: "nonexistent"}
                 ]
               })

      assert res.message == "Replacement statuses must be existing statuses that are not being deleted"
    end

    test "validation fails when replacement status is also being deleted", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Try to delete both "status_a" and "status_b", but use "status_b" as replacement for "status_a"
      new_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false}
      ]

      assert {400, res} =
               mutation(ctx.conn, [:projects, :update_task_statuses], %{
                 project_id: Paths.project_id(ctx.project),
                 task_statuses: new_statuses,
                 deleted_status_replacements: [
                   %{deleted_status_id: "status_a", replacement_status_id: "status_b"},
                   %{deleted_status_id: "status_b", replacement_status_id: "todo"}
                 ]
               })

      assert res.message == "Replacement statuses must be existing statuses that are not being deleted"
    end

    test "tasks with deleted statuses are updated to replacement status", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # First, set up the project with custom statuses
      old_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "in_review", label: "In Review", color: "blue", index: 1, value: "in_review", closed: false},
        %{id: "blocked", label: "Blocked", color: "red", index: 2, value: "blocked", closed: false},
        %{id: "done", label: "Done", color: "green", index: 3, value: "done", closed: true}
      ]

      assert {200, _} =
               mutation(ctx.conn, [:projects, :update_task_statuses], %{
                 project_id: Paths.project_id(ctx.project),
                 task_statuses: old_statuses
               })

      # Create tasks with statuses, then delete two of the statuses.
      project = Repo.reload(ctx.project)
      in_review_status = Enum.find(Operately.Projects.Project.task_statuses(project), &(&1.id == "in_review"))
      blocked_status = Enum.find(Operately.Projects.Project.task_statuses(project), &(&1.id == "blocked"))
      done_status = Enum.find(Operately.Projects.Project.task_statuses(project), &(&1.id == "done"))

      ctx =
        Factory.add_project_task(ctx, :task_in_review, :milestone,
          name: "Task in review",
          task_status: Map.from_struct(in_review_status)
        )

      ctx =
        Factory.add_project_task(ctx, :task_blocked, :milestone,
          name: "Task blocked",
          task_status: Map.from_struct(blocked_status)
        )

      ctx =
        Factory.add_project_task(ctx, :task_done, :milestone,
          name: "Task done",
          task_status: Map.from_struct(done_status)
        )

      task_in_review = Repo.reload(ctx.task_in_review)
      assert task_in_review.task_status.id == "in_review"
      assert task_in_review.task_status.label == "In Review"

      task_blocked = Repo.reload(ctx.task_blocked)
      assert task_blocked.task_status.id == "blocked"
      assert task_blocked.task_status.label == "Blocked"

      task_done = Repo.reload(ctx.task_done)
      assert task_done.task_status.id == "done"
      assert task_done.task_status.label == "Done"

      # Now update statuses, deleting "in_review" and "blocked" and replacing them with "todo"
      new_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "done", label: "Done", color: "green", index: 1, value: "done", closed: true}
      ]

      assert {200, res} =
               mutation(ctx.conn, [:projects, :update_task_statuses], %{
                 project_id: Paths.project_id(ctx.project),
                 task_statuses: new_statuses,
                 deleted_status_replacements: [
                   %{deleted_status_id: "in_review", replacement_status_id: "todo"},
                   %{deleted_status_id: "blocked", replacement_status_id: "todo"}
                 ]
               })

      assert res.success == true

      # Verify only tasks with deleted statuses were updated
      task_in_review = Repo.reload(ctx.task_in_review)
      assert task_in_review.task_status.id == "todo"
      assert task_in_review.task_status.label == "Todo"

      task_blocked = Repo.reload(ctx.task_blocked)
      assert task_blocked.task_status.id == "todo"
      assert task_blocked.task_status.label == "Todo"

      task_done = Repo.reload(ctx.task_done)
      assert task_done.task_status.id == "done"
      assert task_done.task_status.label == "Done"
    end

    test "it can add a new status and use it as a replacement for a deleted status", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      old_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "in_review", label: "In Review", color: "blue", index: 1, value: "in_review", closed: false},
        %{id: "done", label: "Done", color: "green", index: 2, value: "done", closed: true}
      ]

      assert {200, _} =
               mutation(ctx.conn, [:projects, :update_task_statuses], %{
                 project_id: Paths.project_id(ctx.project),
                 task_statuses: old_statuses
               })

      project = Repo.reload(ctx.project)
      in_review_status = Enum.find(Operately.Projects.Project.task_statuses(project), &(&1.id == "in_review"))

      ctx =
        Factory.add_project_task(ctx, :task_in_review, :milestone,
          name: "Task in review",
          task_status: Map.from_struct(in_review_status)
        )

      task_in_review = Repo.reload(ctx.task_in_review)
      assert task_in_review.task_status.id == "in_review"

      # Add a brand new status ("triage") and delete "in_review".
      new_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "triage", label: "Triage", color: "red", index: 1, value: "triage", closed: false},
        %{id: "done", label: "Done", color: "green", index: 2, value: "done", closed: true}
      ]

      assert {200, res} =
               mutation(ctx.conn, [:projects, :update_task_statuses], %{
                 project_id: Paths.project_id(ctx.project),
                 task_statuses: new_statuses,
                 deleted_status_replacements: [
                   %{deleted_status_id: "in_review", replacement_status_id: "triage"}
                 ]
               })

      assert res.success == true

      project = Repo.reload(ctx.project)
      assert Enum.any?(Operately.Projects.Project.task_statuses(project), &(&1.id == "triage"))

      task_in_review = Repo.reload(ctx.task_in_review)
      assert task_in_review.task_status.id == "triage"
      assert task_in_review.task_status.label == "Triage"
    end
  end
end
