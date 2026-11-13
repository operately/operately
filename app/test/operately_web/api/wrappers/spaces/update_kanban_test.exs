defmodule OperatelyWeb.Api.Wrappers.Spaces.UpdateKanbanTest do
  use OperatelyWeb.TurboCase
  import Ecto.Query, only: [from: 2]
  alias Operately.Tasks.TaskBoard

  setup ctx, do: Factory.setup(ctx)

  describe "update task kanban" do
    setup ctx do
      ctx
      |> Factory.add_space(:engineering)
      |> Factory.create_space_task(:space_task, :engineering)
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:spaces, :update_kanban], %{})
    end

    test "it updates status and kanban state for a space", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      space = Repo.preload(Repo.reload(ctx.engineering), :default_task_board)

      status_input =
        Enum.find(space.default_task_board.task_statuses || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      kanban_state = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.space_task)],
        done: [],
        canceled: []
      }

      activities = Repo.aggregate(Operately.Activities.Activity, :count)

      assert {200, res} =
               mutation(ctx.conn, [:spaces, :update_kanban], %{
                 space_id: Paths.space_id(ctx.engineering),
                 task_id: Paths.task_id(ctx.space_task),
                 status: status_input,
                 kanban_state: Jason.encode!(kanban_state)
               })

      assert Map.keys(res) |> Enum.sort() == [:board_id, :task]
      assert res.board_id == Operately.ShortUuid.encode!(space.default_task_board_id)
      assert Repo.aggregate(Operately.Activities.Activity, :count) == activities + 1
      assert res.task.status.value == "in_progress"

      space = Repo.preload(Repo.reload(ctx.engineering), :default_task_board)
      assert space.default_task_board.tasks_kanban_state["in_progress"] == kanban_state.in_progress
    end

    test "it rejects invalid statuses in space kanban state", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      space = Repo.preload(Repo.reload(ctx.engineering), :default_task_board)

      status_input =
        Enum.find(space.default_task_board.task_statuses || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      invalid_kanban_state = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.space_task)],
        done: [],
        canceled: [],
        invalid_status: [Paths.task_id(ctx.space_task)]
      }

      assert {400, res} =
               mutation(ctx.conn, [:spaces, :update_kanban], %{
                 space_id: Paths.space_id(ctx.engineering),
                 task_id: Paths.task_id(ctx.space_task),
                 status: status_input,
                 kanban_state: Jason.encode!(invalid_kanban_state)
               })

      assert res.message == "Invalid status invalid_status"
    end

    test "it creates an activity when space task status is updated", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      space = Repo.preload(Repo.reload(ctx.engineering), :default_task_board)

      status_input =
        Enum.find(space.default_task_board.task_statuses || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      kanban_state = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.space_task)],
        done: [],
        canceled: []
      }

      assert {200, _res} =
               mutation(ctx.conn, [:spaces, :update_kanban], %{
                 space_id: Paths.space_id(ctx.engineering),
                 task_id: Paths.task_id(ctx.space_task),
                 status: status_input,
                 kanban_state: Jason.encode!(kanban_state)
               })

      activity = from(a in Operately.Activities.Activity, where: a.action == "task_status_updating") |> Repo.one()
      assert activity != nil
      assert activity.content["space_id"] == ctx.engineering.id
      assert activity.content["project_id"] == nil
      assert activity.content["task_id"] == ctx.space_task.id
    end

    test "it only creates activity when task status changes", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      space = Repo.preload(Repo.reload(ctx.engineering), :default_task_board)

      status_input =
        Enum.find(space.default_task_board.task_statuses || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      kanban_state = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.space_task)],
        done: [],
        canceled: []
      }

      before_count = count_task_activities(ctx.space_task, "task_status_updating")

      assert {200, _} =
               mutation(ctx.conn, [:spaces, :update_kanban], %{
                 space_id: Paths.space_id(ctx.engineering),
                 task_id: Paths.task_id(ctx.space_task),
                 status: status_input,
                 kanban_state: Jason.encode!(kanban_state)
               })

      assert count_task_activities(ctx.space_task, "task_status_updating") == before_count + 1

      assert {200, _} =
               mutation(ctx.conn, [:spaces, :update_kanban], %{
                 space_id: Paths.space_id(ctx.engineering),
                 task_id: Paths.task_id(ctx.space_task),
                 status: status_input,
                 kanban_state: Jason.encode!(kanban_state)
               })

      assert count_task_activities(ctx.space_task, "task_status_updating") == before_count + 1
    end

    test "it doesn't create an activity when only the order changes", ctx do
      ctx =
        ctx
        |> Factory.create_space_task(:task1, :engineering)
        |> Factory.create_space_task(:task2, :engineering)
        |> Factory.log_in_person(:creator)

      space = Repo.preload(Repo.reload(ctx.engineering), :default_task_board)

      status_input =
        Enum.find(space.default_task_board.task_statuses || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      kanban_state_1 = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.task1), Paths.task_id(ctx.task2)],
        done: [],
        canceled: []
      }

      kanban_state_2 = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.task2), Paths.task_id(ctx.task1)],
        done: [],
        canceled: []
      }

      before_count = count_task_activities(ctx.task1, "task_status_updating")

      assert {200, _} =
               mutation(ctx.conn, [:spaces, :update_kanban], %{
                 space_id: Paths.space_id(ctx.engineering),
                 task_id: Paths.task_id(ctx.task1),
                 status: status_input,
                 kanban_state: Jason.encode!(kanban_state_1)
               })

      assert count_task_activities(ctx.task1, "task_status_updating") == before_count + 1

      assert {200, _} =
               mutation(ctx.conn, [:spaces, :update_kanban], %{
                 space_id: Paths.space_id(ctx.engineering),
                 task_id: Paths.task_id(ctx.task1),
                 status: status_input,
                 kanban_state: Jason.encode!(kanban_state_2)
               })

      space = Repo.preload(Repo.reload(ctx.engineering), :default_task_board)
      assert space.default_task_board.tasks_kanban_state["in_progress"] == kanban_state_2.in_progress
      assert count_task_activities(ctx.task1, "task_status_updating") == before_count + 1
    end

    test "it doesn't work when the task doesn't belong to the space", ctx do
      ctx =
        ctx
        |> Factory.add_space(:other_space)
        |> Factory.create_space_task(:foreign_task, :other_space)
        |> Factory.log_in_person(:creator)

      space = Repo.preload(Repo.reload(ctx.engineering), :default_task_board)

      status_input =
        Enum.find(space.default_task_board.task_statuses || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      kanban_state = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.foreign_task)],
        done: [],
        canceled: []
      }

      assert {404, _} =
               mutation(ctx.conn, [:spaces, :update_kanban], %{
                 space_id: Paths.space_id(ctx.engineering),
                 task_id: Paths.task_id(ctx.foreign_task),
                 status: status_input,
                 kanban_state: Jason.encode!(kanban_state)
               })
    end
  end

  test "ordering mutations only affect the default board", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.create_space_task(:default_task, :space)
      |> Factory.log_in_person(:creator)

    default_board = board_for(ctx.space)
    other_board = Repo.insert!(%TaskBoard{space_id: ctx.space.id, name: "Other", task_statuses: default_board.task_statuses})
    ctx = Factory.create_space_task(ctx, :other_task, :space, board_id: other_board.id)

    space_id = Paths.space_id(ctx.space)
    default_task_id = Paths.task_id(ctx.default_task)
    other_task_id = Paths.task_id(ctx.other_task)
    status = default_board.task_statuses |> hd() |> Map.from_struct() |> Map.update!(:color, &to_string/1)

    # A task from another board cannot be moved through the space endpoint.
    assert {404, _} =
             mutation(ctx.conn, [:spaces, :update_kanban], %{
               space_id: space_id,
               task_id: other_task_id,
               status: status,
               kanban_state: Jason.encode!(%{status.value => [other_task_id]})
             })

    # Updating a default-board task cannot include another board's task in its ordering.
    assert {404, _} =
             mutation(ctx.conn, [:spaces, :update_kanban], %{
               space_id: space_id,
               task_id: default_task_id,
               status: status,
               kanban_state: Jason.encode!(%{status.value => [default_task_id, other_task_id]})
             })
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
               mutation(ctx.conn, [:spaces, :update_kanban], %{
                 space_id: ctx.space.id,
                 board_id: ctx.board.id,
                 task_id: ctx.other_task.id,
                 status: hd(statuses),
                 kanban_state: Jason.encode!(%{})
               })
    end

    test "updates only the selected board", ctx do
      default_before = board_for(ctx.space)

      statuses =
        Enum.map(ctx.board.task_statuses, fn status ->
          status |> Serializer.serialize() |> Map.put(:label, "Selected board")
        end)

      status = hd(statuses)
      ordering = %{status.value => [Paths.task_id(ctx.other_task)]}

      assert {200, response} =
               mutation(ctx.conn, [:spaces, :update_kanban], %{
                 space_id: Paths.space_id(ctx.space),
                 board_id: ctx.board.id,
                 task_id: Paths.task_id(ctx.other_task),
                 status: status,
                 kanban_state: Jason.encode!(ordering)
               })

      assert Repo.reload!(ctx.board).tasks_kanban_state[status.value] == ordering[status.value]
      assert response.board_id == Operately.ShortUuid.encode!(ctx.board.id)
      assert board_for(ctx.space) == default_before
    end
  end

  defp count_task_activities(task, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["task_id"] == ^task.id
    )
    |> Repo.aggregate(:count)
  end

  defp board_for(space), do: Repo.get!(TaskBoard, space.default_task_board_id)
end
