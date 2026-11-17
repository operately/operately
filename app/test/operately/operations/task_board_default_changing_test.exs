defmodule Operately.Operations.TaskBoardDefaultChangingTest do
  use Operately.DataCase
  alias Ecto.Adapters.SQL.Sandbox
  alias Operately.Operations.{TaskBoardCreating, TaskBoardDefaultChanging}
  alias Operately.Activities.Activity

  test "rechecks the selected board after locking" do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.add_space(:other_space)
    {:ok, board} = TaskBoardCreating.run(ctx.creator, ctx.space, "Other")
    board |> Ecto.Changeset.change(space_id: ctx.other_space.id) |> Repo.update!()
    assert {:error, :bad_request} = TaskBoardDefaultChanging.run(ctx.creator, ctx.space, board)

    board |> Ecto.Changeset.change(archived_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)) |> Repo.update!()
    Repo.reload!(board) |> Ecto.Changeset.change(space_id: ctx.space.id) |> Repo.update!()
    assert {:error, :board_archived} = TaskBoardDefaultChanging.run(ctx.creator, ctx.space, board)
    assert Repo.reload!(ctx.space).default_task_board_id == ctx.space.default_task_board_id
    refute Repo.exists?(from a in Activity, where: a.action == "task_board_default_changed")
  end

  test "concurrent changes serialize and record the current default, even with stale input" do
    Sandbox.unboxed_run(Repo, fn ->
      ctx = Factory.setup(%{}) |> Factory.add_space(:space)
      {:ok, board} = TaskBoardCreating.run(ctx.creator, ctx.space, "Other")
      original = Repo.get!(Operately.Tasks.TaskBoard, ctx.space.default_task_board_id)
      parent = self()

      try do
        first = Elixir.Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn ->
            Repo.transaction(fn ->
              assert {:ok, _} = TaskBoardDefaultChanging.run(ctx.creator, ctx.space, board)
              send(parent, {:locked, self()})
              receive do
                :continue -> :ok
              after
                5_000 -> raise "writer was not released"
              end
            end)
          end)
        end)

        assert_receive {:locked, writer}, 5_000
        second = Elixir.Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn -> TaskBoardDefaultChanging.run(ctx.creator, ctx.space, original) end)
        end)
        assert Elixir.Task.yield(second, 50) == nil
        send(writer, :continue)
        assert {:ok, :ok} = Elixir.Task.await(first)
        assert {:ok, space} = Elixir.Task.await(second)
        assert space.default_task_board_id == original.id

        changes = Repo.all(from a in Activity, where: a.action == "task_board_default_changed" and a.content["space_id"] == ^ctx.space.id)
        assert length(changes) == 2
        assert Enum.any?(changes, &(&1.content["board_id"] == board.id and &1.content["previous_board_id"] == original.id))
        assert Enum.any?(changes, &(&1.content["board_id"] == original.id and &1.content["previous_board_id"] == board.id))
      after
        Repo.delete!(ctx.company)
        Repo.delete!(ctx.account)
      end
    end)
  end
end
