defmodule Operately.Operations.TaskBoardArchivingTest do
  use Operately.DataCase
  alias Ecto.Adapters.SQL.Sandbox
  alias Operately.Operations.{TaskBoardArchiving, TaskBoardCreating, TaskBoardDefaultChanging}

  test "rechecks ownership after locking" do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.add_space(:other_space)
    {:ok, board} = TaskBoardCreating.run(ctx.creator, ctx.space, "Other")
    board |> Ecto.Changeset.change(space_id: ctx.other_space.id) |> Repo.update!()
    assert {:error, :bad_request} = TaskBoardArchiving.run(ctx.creator, ctx.space, board)
    assert is_nil(Repo.reload!(board).archived_at)
  end

  test "a default change waiting for archival cannot select the archived board" do
    Sandbox.unboxed_run(Repo, fn ->
      ctx = Factory.setup(%{}) |> Factory.add_space(:space)
      {:ok, board} = TaskBoardCreating.run(ctx.creator, ctx.space, "Other")
      parent = self()

      try do
        archive = Elixir.Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn ->
            Repo.transaction(fn ->
              assert {:ok, _} = TaskBoardArchiving.run(ctx.creator, ctx.space, board)
              send(parent, {:archived, self()})
              receive do
                :continue -> :ok
              after
                5_000 -> raise "archiver was not released"
              end
            end)
          end)
        end)

        assert_receive {:archived, writer}, 5_000
        select = Elixir.Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn -> TaskBoardDefaultChanging.run(ctx.creator, ctx.space, board) end)
        end)
        assert Elixir.Task.yield(select, 50) == nil
        send(writer, :continue)
        assert {:ok, :ok} = Elixir.Task.await(archive)
        assert {:error, :board_archived} = Elixir.Task.await(select)
        assert Repo.reload!(ctx.space).default_task_board_id == ctx.space.default_task_board_id
      after
        Repo.delete!(ctx.company)
        Repo.delete!(ctx.account)
      end
    end)
  end

  test "archival waiting for a default change rejects archiving the new default" do
    Sandbox.unboxed_run(Repo, fn ->
      ctx = Factory.setup(%{}) |> Factory.add_space(:space)
      {:ok, board} = TaskBoardCreating.run(ctx.creator, ctx.space, "New default")
      parent = self()

      try do
        select = Elixir.Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn ->
            Repo.transaction(fn ->
              assert {:ok, _} = TaskBoardDefaultChanging.run(ctx.creator, ctx.space, board)
              send(parent, {:selected, self()})
              receive do
                :continue -> :ok
              after
                5_000 -> raise "default writer was not released"
              end
            end)
          end)
        end)

        assert_receive {:selected, writer}, 5_000
        archive = Elixir.Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn -> TaskBoardArchiving.run(ctx.creator, ctx.space, board) end)
        end)
        assert Elixir.Task.yield(archive, 50) == nil
        send(writer, :continue)
        assert {:ok, :ok} = Elixir.Task.await(select)
        assert {:error, :default_board} = Elixir.Task.await(archive)
        assert Repo.reload!(ctx.space).default_task_board_id == board.id
        assert is_nil(Repo.reload!(board).archived_at)
      after
        Repo.delete!(ctx.company)
        Repo.delete!(ctx.account)
      end
    end)
  end
end
