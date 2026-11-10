defmodule OperatelyWeb.Mcp.Tools.Tasks.RenameBoardTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Tasks.RenameBoard

  setup ctx, do: ctx |> Factory.setup() |> Factory.add_space(:space)

  test "decodes board IDs and forwards the new name", ctx do
    id = Operately.ShortUuid.encode!(ctx.space.default_task_board_id)
    assert {:ok, %{success: true}} = RenameBoard.call(ToolConnHelper.conn(ctx), %{"board_id" => id, "new_name" => "Design"})
    assert Repo.get!(Operately.Tasks.TaskBoard, ctx.space.default_task_board_id).name == "Design"
  end

  test "rejects foreign boards and malformed identifiers", ctx do
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)
    id = Operately.ShortUuid.encode!(foreign.space.default_task_board_id)
    assert {:error, :not_found} = RenameBoard.call(ToolConnHelper.conn(ctx), %{"board_id" => id, "new_name" => "Design"})
    assert {:error, :invalid_arguments} = RenameBoard.call(ToolConnHelper.conn(ctx), %{"board_id" => "@invalid!", "new_name" => "Design"})
  end
end
