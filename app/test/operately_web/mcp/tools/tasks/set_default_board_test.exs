defmodule OperatelyWeb.Mcp.Tools.Tasks.SetDefaultBoardTest do
  use Operately.DataCase, async: true
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Tasks.SetDefaultBoard

  setup ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space)
    {:ok, board} = Operately.Operations.TaskBoardCreating.run(ctx.creator, ctx.space, "Other")
    Map.put(ctx, :board, board)
  end

  test "decodes space and board IDs and selects the default", ctx do
    assert {:ok, %{success: true}} = SetDefaultBoard.call(ToolConnHelper.conn(ctx), arguments(ctx))
    assert Repo.reload!(ctx.space).default_task_board_id == ctx.board.id
  end

  test "preserves archive error details", ctx do
    ctx.board |> Ecto.Changeset.change(archived_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)) |> Repo.update!()
    assert {:error, :bad_request, _, %{code: "task_board_archived"}} = SetDefaultBoard.call(ToolConnHelper.conn(ctx), arguments(ctx))
  end

  test "rejects foreign boards and malformed identifiers", ctx do
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)
    args = Map.put(arguments(ctx), "board_id", Operately.ShortUuid.encode!(foreign.space.default_task_board_id))
    assert {:error, :not_found} = SetDefaultBoard.call(ToolConnHelper.conn(ctx), args)
    for key <- ["space_id", "board_id"] do
      assert {:error, :invalid_arguments} = SetDefaultBoard.call(ToolConnHelper.conn(ctx), Map.put(arguments(ctx), key, "@invalid!"))
    end
  end

  defp arguments(ctx), do: %{"space_id" => Operately.ShortUuid.encode!(ctx.space.id), "board_id" => Operately.ShortUuid.encode!(ctx.board.id)}
end
