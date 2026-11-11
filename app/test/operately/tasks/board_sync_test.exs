defmodule Operately.Tasks.BoardSyncTest do
  use Operately.DataCase
  alias Operately.Tasks.{BoardSync, TaskBoard, Task}

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.create_space_task(:task, :space)
  end

  test "rejects a stale authorized task after it has moved to another board", ctx do
    board = Repo.insert!(%TaskBoard{space_id: ctx.space.id, name: "Other"})
    ctx.task |> change(board_id: board.id) |> Repo.update!()
    assert {:ok, {:error, :not_found}} = Repo.transaction(fn ->
      {:ok, boards} = BoardSync.lock_boards([ctx.task.board_id])
      BoardSync.lock_task(ctx.task, boards)
    end)
  end

  test "ordinary changesets reject task and default references to another space", ctx do
    ctx = Factory.add_space(ctx, :other)
    board = Repo.get!(TaskBoard, ctx.other.default_task_board_id)
    assert {:error, changeset} = ctx.task |> Task.changeset(%{board_id: board.id}) |> Repo.update()
    assert errors_on(changeset).board_id == ["is invalid"]
    refute Operately.Groups.Group.default_task_board_changeset(ctx.space, board).valid?
    assert Repo.reload!(ctx.task).board_id == ctx.space.default_task_board_id
  end

  test "a waiting writer checks archive state after acquiring the board lock" do
    alias Ecto.Adapters.SQL.Sandbox

    Sandbox.unboxed_run(Repo, fn ->
      ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.create_space_task(:task, :space)
      parent = self()

      try do
        archiver = Elixir.Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn ->
            Repo.transaction(fn ->
              Repo.get!(TaskBoard, ctx.task.board_id) |> change(archived_at: ~N[2026-11-11 12:00:00]) |> Repo.update!()
              send(parent, {:locked, self()})
              receive do
                :continue -> :ok
              after
                5_000 -> raise "archiver was not released"
              end
            end)
          end)
        end)

        assert_receive {:locked, archiver_pid}, 5_000
        writer = Elixir.Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn -> Operately.Tasks.update_task(ctx.task, %{name: "Blocked"}) end)
        end)
        assert Elixir.Task.yield(writer, 50) == nil
        send(archiver_pid, :continue)
        assert {:ok, :ok} = Elixir.Task.await(archiver)
        assert {:error, {:bad_request, _, %{code: "task_board_archived"}}} = Elixir.Task.await(writer)
        assert Repo.reload!(ctx.task).name == ctx.task.name
      after
        Repo.delete!(ctx.company)
        Repo.delete!(ctx.account)
      end
    end)
  end

  test "concurrent writers append tasks without losing ordering" do
    alias Ecto.Adapters.SQL.Sandbox

    Sandbox.unboxed_run(Repo, fn ->
      ctx = Factory.setup(%{}) |> Factory.add_space(:concurrent_space)
      parent = self()

      try do
        first =
          Elixir.Task.async(fn ->
            Sandbox.unboxed_run(Repo, fn ->
              Repo.transaction(fn ->
                {:ok, _} = BoardSync.lock_boards([ctx.concurrent_space.default_task_board_id])
                send(parent, {:locked, self()})

                receive do
                  :continue -> :ok
                after
                  5_000 -> raise "writer was not released"
                end

                Factory.create_space_task(ctx, :first, :concurrent_space).first
              end)
            end)
          end)

        assert_receive {:locked, writer}, 5_000

        second =
          Elixir.Task.async(fn ->
            Sandbox.unboxed_run(Repo, fn -> Factory.create_space_task(ctx, :second, :concurrent_space).second end)
          end)

        assert Elixir.Task.yield(second, 50) == nil
        send(writer, :continue)
        {:ok, first_task} = Elixir.Task.await(first)
        second_task = Elixir.Task.await(second)
        board = Repo.get!(TaskBoard, ctx.concurrent_space.default_task_board_id)
        assert board.tasks_kanban_state[first_task.task_status.value] == Enum.map([first_task, second_task], &OperatelyWeb.Paths.task_id/1)
      after
        Repo.delete!(ctx.company)
        Repo.delete!(ctx.account)
      end
    end)
  end
end
