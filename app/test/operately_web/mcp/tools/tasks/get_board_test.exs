defmodule OperatelyWeb.Mcp.Tools.Tasks.GetBoardTest do
  use Operately.DataCase, async: true

  alias Operately.ShortUuid
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Tasks.GetBoard
  alias OperatelyWeb.Paths

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_space(:space)
  end

  test "decodes IDs and returns the shared endpoint response", ctx do
    arguments = %{"space_id" => Paths.space_id(ctx.space), "board_id" => ShortUuid.encode!(ctx.space.default_task_board_id)}
    conn = ToolConnHelper.conn(ctx)

    assert {:ok, result} = GetBoard.call(conn, arguments)
    assert {:ok, ^result} = OperatelyWeb.Api.Tasks.GetBoard.call(conn, %{space_id: ctx.space.id, board_id: ctx.space.default_task_board_id})
    assert result.board.id == arguments["board_id"]
  end

  test "rejects missing or malformed IDs", ctx do
    for arguments <- [
          %{},
          %{"space_id" => Paths.space_id(ctx.space)},
          %{"space_id" => "@invalid!", "board_id" => ShortUuid.encode!(ctx.space.default_task_board_id)},
          %{"space_id" => Paths.space_id(ctx.space), "board_id" => "@invalid!"}
        ] do
      assert {:error, :invalid_arguments} = GetBoard.call(ToolConnHelper.conn(ctx), arguments)
    end
  end

  test "preserves ownership and company isolation checks", ctx do
    ctx = Factory.add_space(ctx, :other)
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)
    conn = ToolConnHelper.conn(ctx)

    assert {:error, :bad_request} = GetBoard.call(conn, %{"space_id" => Paths.space_id(ctx.space), "board_id" => ShortUuid.encode!(ctx.other.default_task_board_id)})
    assert {:error, :not_found} = GetBoard.call(conn, %{"space_id" => Paths.space_id(ctx.space), "board_id" => ShortUuid.encode!(foreign.space.default_task_board_id)})
  end

  test "accepts a project board without a space selector", ctx do
    ctx = Factory.add_project(ctx, :project, :space)
    board = Operately.Projects.Project.task_board(ctx.project)
    assert {:ok, %{board: result}} = GetBoard.call(ToolConnHelper.conn(ctx), %{"board_id" => ShortUuid.encode!(board.id), "project_id" => Paths.project_id(ctx.project)})
    assert result.project_id == ShortUuid.encode!(ctx.project.id)
  end
end
