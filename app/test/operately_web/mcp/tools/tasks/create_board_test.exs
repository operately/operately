defmodule OperatelyWeb.Mcp.Tools.Tasks.CreateBoardTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Tasks.CreateBoard
  alias OperatelyWeb.Paths

  setup ctx, do: ctx |> Factory.setup() |> Factory.add_space(:space)

  test "decodes space IDs and returns a new non-default board", ctx do
    assert {:ok, %{board: board}} = CreateBoard.call(ToolConnHelper.conn(ctx), %{"space_id" => Paths.space_id(ctx.space), "name" => "Design"})
    assert board.name == "Design"
    refute board.is_default
    assert board.position == 1
  end

  test "rejects foreign spaces and malformed identifiers", ctx do
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)
    assert {:error, :not_found} = CreateBoard.call(ToolConnHelper.conn(ctx), %{"space_id" => Paths.space_id(foreign.space), "name" => "Design"})
    assert {:error, :invalid_arguments} = CreateBoard.call(ToolConnHelper.conn(ctx), %{"space_id" => "@invalid!", "name" => "Design"})
  end
end
