defmodule Operately.Operations.TaskBoardCreatingTest do
  use Operately.DataCase
  alias Ecto.Adapters.SQL.Sandbox
  alias Operately.Operations.TaskBoardCreating
  alias Operately.Tasks.TaskBoard

  test "concurrent creation appends distinct positions without changing the default" do
    Sandbox.unboxed_run(Repo, fn ->
      ctx = Factory.setup(%{}) |> Factory.add_space(:space)
      parent = self()

      try do
        first = Elixir.Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn ->
            Repo.transaction(fn ->
              {:ok, _} = Operately.Repo.Locking.lock_for_update(Repo, ctx.space)
              send(parent, {:locked, self()})
              receive do
                :continue -> :ok
              after
                5_000 -> raise "writer was not released"
              end
              TaskBoardCreating.run(ctx.creator, ctx.space, "First")
            end)
          end)
        end)

        assert_receive {:locked, writer}, 5_000
        second = Elixir.Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn -> TaskBoardCreating.run(ctx.creator, ctx.space, "Second") end)
        end)
        assert Elixir.Task.yield(second, 50) == nil
        send(writer, :continue)
        assert {:ok, {:ok, first_board}} = Elixir.Task.await(first)
        assert {:ok, second_board} = Elixir.Task.await(second)
        assert first_board.position == 1
        assert second_board.position == 2
        assert Repo.reload!(ctx.space).default_task_board_id == ctx.space.default_task_board_id
        assert Repo.aggregate(from(b in TaskBoard, where: b.space_id == ^ctx.space.id), :count) == 3
      after
        Repo.delete!(ctx.company)
        Repo.delete!(ctx.account)
      end
    end)
  end
end
