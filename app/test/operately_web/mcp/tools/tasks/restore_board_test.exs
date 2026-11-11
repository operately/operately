defmodule OperatelyWeb.Mcp.Tools.Tasks.RestoreBoardTest do
  use Operately.DataCase, async: true
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Tasks.RestoreBoard

  setup ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space)
    {:ok, board} = Operately.Operations.TaskBoardCreating.run(ctx.creator, ctx.space, "Other")
    board |> Ecto.Changeset.change(archived_at: ~N[2026-11-11 12:00:00]) |> Repo.update!()
    Map.put(ctx, :board, board)
  end

  test "decodes space and board IDs and restores the board", ctx do
    assert {:ok, %{success: true}} = RestoreBoard.call(ToolConnHelper.conn(ctx), arguments(ctx))
    assert is_nil(Repo.reload!(ctx.board).archived_at)
  end

  test "rejects foreign boards and malformed identifiers", ctx do
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)
    args = Map.put(arguments(ctx), "board_id", Operately.ShortUuid.encode!(foreign.space.default_task_board_id))
    assert {:error, :not_found} = RestoreBoard.call(ToolConnHelper.conn(ctx), args)

    for key <- ["space_id", "board_id"] do
      assert {:error, :invalid_arguments} = RestoreBoard.call(ToolConnHelper.conn(ctx), Map.put(arguments(ctx), key, "@invalid!"))
    end
  end

  defp arguments(ctx), do: %{"space_id" => Operately.ShortUuid.encode!(ctx.space.id), "board_id" => Operately.ShortUuid.encode!(ctx.board.id)}
end
