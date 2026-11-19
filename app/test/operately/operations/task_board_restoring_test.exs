defmodule Operately.Operations.TaskBoardRestoringTest do
  use Operately.DataCase
  alias Ecto.Adapters.SQL.Sandbox
  alias Operately.Operations.{TaskBoardArchiving, TaskBoardCreating, TaskBoardRestoring}

  test "rechecks space ownership under the lock" do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.add_space(:other_space)
    {:ok, board} = TaskBoardCreating.run(ctx.creator, ctx.space, "Other")
    {:ok, _} = TaskBoardArchiving.run(ctx.creator, ctx.space, board)

    Repo.reload!(board) |> Ecto.Changeset.change(space_id: ctx.other_space.id) |> Repo.update!()

    assert {:error, :bad_request} = TaskBoardRestoring.run(ctx.creator, ctx.space, board)
    assert Repo.reload!(board).archived_at
  end

  test "concurrent restores append at distinct positions without changing the default" do
    Sandbox.unboxed_run(Repo, fn ->
      ctx = Factory.setup(%{}) |> Factory.add_space(:space)
      {:ok, first} = TaskBoardCreating.run(ctx.creator, ctx.space, "First")
      {:ok, second} = TaskBoardCreating.run(ctx.creator, ctx.space, "Second")
      {:ok, _} = TaskBoardArchiving.run(ctx.creator, ctx.space, first)
      {:ok, _} = TaskBoardArchiving.run(ctx.creator, ctx.space, second)

      try do
        results =
          [first, second]
          |> Enum.map(fn board ->
            Elixir.Task.async(fn -> Sandbox.unboxed_run(Repo, fn -> TaskBoardRestoring.run(ctx.creator, ctx.space, board) end) end)
          end)
          |> Enum.map(&Elixir.Task.await/1)

        positions = Enum.map(results, fn {:ok, board} -> board.position end)
        assert Enum.sort(positions) == [1, 2]
        assert Repo.reload!(ctx.space).default_task_board_id == ctx.space.default_task_board_id
      after
        Repo.delete!(ctx.company)
        Repo.delete!(ctx.account)
      end
    end)
  end
end
