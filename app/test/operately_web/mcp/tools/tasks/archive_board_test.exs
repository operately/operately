defmodule OperatelyWeb.Mcp.Tools.Tasks.ArchiveBoardTest do
  use Operately.DataCase, async: true
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Tasks.ArchiveBoard

  setup ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space)
    {:ok, board} = Operately.Operations.TaskBoardCreating.run(ctx.creator, ctx.space, "Other")
    Map.put(ctx, :board, board)
  end

  test "decodes space and board IDs and archives the board", ctx do
    assert {:ok, %{success: true}} = ArchiveBoard.call(ToolConnHelper.conn(ctx), arguments(ctx))
    assert Repo.reload!(ctx.board).archived_at
  end

  test "preserves the default board archive error", ctx do
    args = arguments(ctx) |> Map.put("board_id", Operately.ShortUuid.encode!(ctx.space.default_task_board_id))
    assert {:error, :bad_request, _, %{code: "default_task_board_archive_forbidden"}} = ArchiveBoard.call(ToolConnHelper.conn(ctx), args)
    assert Repo.reload!(ctx.space).default_task_board_id == ctx.space.default_task_board_id
  end

  test "rejects foreign boards and malformed identifiers", ctx do
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)
    args = Map.put(arguments(ctx), "board_id", Operately.ShortUuid.encode!(foreign.space.default_task_board_id))
    assert {:error, :not_found} = ArchiveBoard.call(ToolConnHelper.conn(ctx), args)

    for key <- ["space_id", "board_id"] do
      assert {:error, :invalid_arguments} = ArchiveBoard.call(ToolConnHelper.conn(ctx), Map.put(arguments(ctx), key, "@invalid!"))
    end
  end

  defp arguments(ctx), do: %{"space_id" => Operately.ShortUuid.encode!(ctx.space.id), "board_id" => Operately.ShortUuid.encode!(ctx.board.id)}
end
