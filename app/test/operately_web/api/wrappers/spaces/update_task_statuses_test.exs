defmodule OperatelyWeb.Api.Wrappers.Spaces.UpdateTaskStatusesTest do
  use OperatelyWeb.TurboCase
  alias Operately.Tasks.TaskBoard
  alias Operately.Access.Binding

  setup ctx, do: Factory.setup(ctx)

  describe "update task statuses" do
    setup ctx do
      ctx
      |> Factory.add_space(:space, company_permissions: Binding.view_access())
    end

    test "deletes an unused status without a replacement", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      statuses = board_for(ctx.space).task_statuses
      [removed | remaining] = statuses

      assert {200, response} =
               mutation(ctx.conn, [:spaces, :update_task_statuses], %{
                 space_id: Paths.space_id(ctx.space),
                 task_statuses: Enum.map(remaining, &(&1 |> Map.from_struct() |> Map.update!(:color, fn color -> to_string(color) end)))
               })

      assert response == %{success: true, board_id: Operately.ShortUuid.encode!(ctx.space.default_task_board_id)}
      refute Enum.any?(board_for(ctx.space).task_statuses, &(&1.id == removed.id))
    end

    for archived <- [false, true] do
      @archived archived
      test "requires a replacement for an occupied status (archived=#{@archived})", ctx do
        ctx = Factory.log_in_person(ctx, :creator)
        statuses = board_for(ctx.space).task_statuses
        [removed | remaining] = statuses
        task_status = Map.from_struct(removed)
        ctx = Factory.create_space_task(ctx, :task, :space, task_status: task_status)

        if @archived do
          ctx.task |> Ecto.Changeset.change(archived_at: ~N[2026-01-01 00:00:00]) |> Repo.update!()
        end

        assert {400, _response} =
                 mutation(ctx.conn, [:spaces, :update_task_statuses], %{
                   space_id: Paths.space_id(ctx.space),
                   task_statuses: Enum.map(remaining, &(&1 |> Map.from_struct() |> Map.update!(:color, fn color -> to_string(color) end))),
                   deleted_status_replacements: []
                 })

        assert board_for(ctx.space).task_statuses == statuses
        assert Repo.reload!(ctx.task).task_status == ctx.task.task_status
      end
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:spaces, :update_task_statuses], %{})
    end

    test "it requires a space_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} =
               mutation(ctx.conn, [:spaces, :update_task_statuses], %{
                 task_statuses: [
                   %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false}
                 ]
               })

      assert res.message == "Missing required fields: space_id"
    end

    test "it requires at least one task status", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} =
               mutation(ctx.conn, [:spaces, :update_task_statuses], %{
                 space_id: Paths.space_id(ctx.space),
                 task_statuses: []
               })

      assert res.message == "At least one task status is required"
    end

    test "it updates task statuses for the space", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "in_progress", label: "In progress", color: "blue", index: 1, value: "in_progress", closed: false},
        %{id: "done", label: "Done", color: "green", index: 2, value: "done", closed: false}
      ]

      assert {200, res} =
               mutation(ctx.conn, [:spaces, :update_task_statuses], %{
                 space_id: Paths.space_id(ctx.space),
                 task_statuses: statuses
               })

      assert res.success == true

      space = Repo.preload(Repo.reload(ctx.space), :default_task_board)

      assert length(space.default_task_board.task_statuses) == 3
      assert Enum.map(space.default_task_board.task_statuses, & &1.label) == ["Todo", "In progress", "Done"]
    end

    test "validation fails when replacement status does not exist in new statuses", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      new_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "done", label: "Done", color: "green", index: 1, value: "done", closed: true}
      ]

      assert {400, res} =
               mutation(ctx.conn, [:spaces, :update_task_statuses], %{
                 space_id: Paths.space_id(ctx.space),
                 task_statuses: new_statuses,
                 deleted_status_replacements: [
                   %{deleted_status_id: "old_status", replacement_status_id: "nonexistent"}
                 ]
               })

      assert res.message == "Replacement statuses must be existing statuses that are not being deleted"
    end

    test "validation fails when replacement status is also being deleted", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      new_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false}
      ]

      assert {400, res} =
               mutation(ctx.conn, [:spaces, :update_task_statuses], %{
                 space_id: Paths.space_id(ctx.space),
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

      old_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "in_review", label: "In Review", color: "blue", index: 1, value: "in_review", closed: false},
        %{id: "blocked", label: "Blocked", color: "red", index: 2, value: "blocked", closed: false},
        %{id: "done", label: "Done", color: "green", index: 3, value: "done", closed: true}
      ]

      assert {200, _} =
               mutation(ctx.conn, [:spaces, :update_task_statuses], %{
                 space_id: Paths.space_id(ctx.space),
                 task_statuses: old_statuses
               })

      space = Repo.preload(Repo.reload(ctx.space), :default_task_board)
      in_review_status = Enum.find(space.default_task_board.task_statuses, &(&1.id == "in_review"))
      blocked_status = Enum.find(space.default_task_board.task_statuses, &(&1.id == "blocked"))
      done_status = Enum.find(space.default_task_board.task_statuses, &(&1.id == "done"))

      task_in_review =
        Operately.TasksFixtures.task_fixture(%{
          creator_id: ctx.creator.id,
          space_id: ctx.space.id,
          task_status: Map.from_struct(in_review_status)
        })

      task_blocked =
        Operately.TasksFixtures.task_fixture(%{
          creator_id: ctx.creator.id,
          space_id: ctx.space.id,
          task_status: Map.from_struct(blocked_status)
        })

      task_done =
        Operately.TasksFixtures.task_fixture(%{
          creator_id: ctx.creator.id,
          space_id: ctx.space.id,
          task_status: Map.from_struct(done_status)
        })

      task_in_review = Repo.reload(task_in_review)
      assert task_in_review.task_status.id == "in_review"

      task_blocked = Repo.reload(task_blocked)
      assert task_blocked.task_status.id == "blocked"

      task_done = Repo.reload(task_done)
      assert task_done.task_status.id == "done"

      new_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "done", label: "Done", color: "green", index: 1, value: "done", closed: true}
      ]

      assert {200, res} =
               mutation(ctx.conn, [:spaces, :update_task_statuses], %{
                 space_id: Paths.space_id(ctx.space),
                 task_statuses: new_statuses,
                 deleted_status_replacements: [
                   %{deleted_status_id: "in_review", replacement_status_id: "todo"},
                   %{deleted_status_id: "blocked", replacement_status_id: "todo"}
                 ]
               })

      assert res.success == true

      task_in_review = Repo.reload(task_in_review)
      assert task_in_review.task_status.id == "todo"

      task_blocked = Repo.reload(task_blocked)
      assert task_blocked.task_status.id == "todo"

      task_done = Repo.reload(task_done)
      assert task_done.task_status.id == "done"

      ordering = board_for(ctx.space).tasks_kanban_state
      assert Enum.sort(ordering["todo"]) == Enum.sort(Enum.map([task_in_review, task_blocked], &Paths.task_id/1))
      assert ordering["done"] == [Paths.task_id(task_done)]
    end

    test "it can add a new status and use it as a replacement for a deleted status", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      old_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "in_review", label: "In Review", color: "blue", index: 1, value: "in_review", closed: false},
        %{id: "done", label: "Done", color: "green", index: 2, value: "done", closed: true}
      ]

      assert {200, _} =
               mutation(ctx.conn, [:spaces, :update_task_statuses], %{
                 space_id: Paths.space_id(ctx.space),
                 task_statuses: old_statuses
               })

      space = Repo.preload(Repo.reload(ctx.space), :default_task_board)
      in_review_status = Enum.find(space.default_task_board.task_statuses, &(&1.id == "in_review"))

      task_in_review =
        Operately.TasksFixtures.task_fixture(%{
          creator_id: ctx.creator.id,
          space_id: ctx.space.id,
          task_status: Map.from_struct(in_review_status)
        })

      task_in_review = Repo.reload(task_in_review)
      assert task_in_review.task_status.id == "in_review"

      new_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "triage", label: "Triage", color: "red", index: 1, value: "triage", closed: false},
        %{id: "done", label: "Done", color: "green", index: 2, value: "done", closed: true}
      ]

      assert {200, res} =
               mutation(ctx.conn, [:spaces, :update_task_statuses], %{
                 space_id: Paths.space_id(ctx.space),
                 task_statuses: new_statuses,
                 deleted_status_replacements: [
                   %{deleted_status_id: "in_review", replacement_status_id: "triage"}
                 ]
               })

      assert res.success == true

      space = Repo.preload(Repo.reload(ctx.space), :default_task_board)
      assert Enum.any?(space.default_task_board.task_statuses, &(&1.id == "triage"))

      task_in_review = Repo.reload(task_in_review)
      assert task_in_review.task_status.id == "triage"
      assert task_in_review.task_status.label == "Triage"
    end

    test "it returns forbidden when the person cannot edit the space", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:outsider)
        |> Factory.log_in_person(:outsider)

      statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false}
      ]

      assert {403, _res} =
               mutation(ctx.conn, [:spaces, :update_task_statuses], %{
                 space_id: Paths.space_id(ctx.space),
                 task_statuses: statuses
               })
    end
  end

  test "status mutations only affect the default board", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.create_space_task(:default_task, :space)
      |> Factory.log_in_person(:creator)

    default_board = board_for(ctx.space)
    other_board = Repo.insert!(%TaskBoard{space_id: ctx.space.id, name: "Other", task_statuses: default_board.task_statuses})
    ctx = Factory.create_space_task(ctx, :other_task, :space, board_id: other_board.id)

    space_id = Paths.space_id(ctx.space)

    updated_statuses =
      Enum.map(default_board.task_statuses, fn status ->
        status
        |> Map.from_struct()
        |> Map.update!(:color, &to_string/1)
        |> Map.put(:label, "Updated")
      end)

    assert {200, _} =
             mutation(ctx.conn, [:spaces, :update_task_statuses], %{
               space_id: space_id,
               task_statuses: updated_statuses
             })

    # Status changes leave the other board untouched.
    assert Repo.reload!(other_board).task_statuses == other_board.task_statuses
    assert Repo.reload!(ctx.other_task).task_status == ctx.other_task.task_status

    assert {200, response} = query(ctx.conn, [:spaces, :get], %{id: space_id})
    assert Enum.all?(response.space.task_statuses, &(&1.label == "Updated"))
  end

  describe "explicit board selection" do
    setup ctx do
      ctx = ctx |> Factory.add_space(:space) |> Factory.log_in_person(:creator)
      board = Repo.insert!(%TaskBoard{space_id: ctx.space.id, name: "Other", task_statuses: board_for(ctx.space).task_statuses})
      ctx |> Map.put(:board, board) |> Factory.create_space_task(:default_task, :space) |> Factory.create_space_task(:other_task, :space, board_id: board.id)
    end

    test "rejects updates to archived boards", ctx do
      ctx.board |> Ecto.Changeset.change(archived_at: ~N[2026-11-11 12:00:00]) |> Repo.update!()
      statuses = Enum.map(ctx.board.task_statuses, &Serializer.serialize/1)

      assert {400, %{details: %{code: "task_board_archived"}}} =
               mutation(ctx.conn, [:spaces, :update_task_statuses], %{
                 space_id: ctx.space.id,
                 board_id: ctx.board.id,
                 task_statuses: statuses
               })
    end

    test "updates only the selected board", ctx do
      default_before = board_for(ctx.space)

      statuses =
        Enum.map(ctx.board.task_statuses, fn status ->
          status |> Serializer.serialize() |> Map.put(:label, "Selected board")
        end)

      assert {200, response} =
               mutation(ctx.conn, [:spaces, :update_task_statuses], %{
                 space_id: Paths.space_id(ctx.space),
                 board_id: ctx.board.id,
                 task_statuses: statuses
               })

      assert Enum.all?(Repo.reload!(ctx.board).task_statuses, &(&1.label == "Selected board"))
      assert response.board_id == Operately.ShortUuid.encode!(ctx.board.id)
      assert board_for(ctx.space) == default_before
    end
  end

  defp board_for(space), do: Repo.get!(TaskBoard, space.default_task_board_id)
end
