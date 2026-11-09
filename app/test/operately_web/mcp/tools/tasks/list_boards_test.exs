defmodule OperatelyWeb.Mcp.Tools.Tasks.ListBoardsTest do
  use Operately.DataCase, async: true

  alias Operately.ShortUuid
  alias Operately.Support.Factory
  alias Operately.Tasks.TaskBoard
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Tasks.ListBoards
  alias OperatelyWeb.Paths

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_space(:space)
  end

  test "decodes the space ID and defaults to active boards", ctx do
    archived = Repo.insert!(%TaskBoard{space_id: ctx.space.id, name: "Archived", position: 1, archived_at: ~N[2026-01-01 00:00:00]})
    conn = ToolConnHelper.conn(ctx)
    arguments = %{"space_id" => Paths.space_id(ctx.space)}

    assert {:ok, %{boards: [%{id: id, is_default: true}]}} = ListBoards.call(conn, arguments)
    assert id == ShortUuid.encode!(ctx.space.default_task_board_id)

    assert {:ok, %{boards: [%{id: ^id}]}} = ListBoards.call(conn, Map.put(arguments, "archive_status", "active"))
    assert {:ok, %{boards: [%{id: archived_id}]}} = ListBoards.call(conn, Map.put(arguments, "archive_status", "archived"))
    assert archived_id == ShortUuid.encode!(archived.id)

    assert {:ok, %{boards: boards}} = ListBoards.call(conn, Map.put(arguments, "archive_status", "all"))
    assert Enum.map(boards, & &1.id) == [id, archived_id]
  end

  test "rejects malformed IDs and invalid archive filters", ctx do
    for arguments <- [
          %{"space_id" => "@invalid!"},
          %{"space_id" => Paths.space_id(ctx.space), "archive_status" => "invalid"}
        ] do
      assert {:error, :invalid_arguments} = ListBoards.call(ToolConnHelper.conn(ctx), arguments)
    end
  end

  test "returns not_found for a space in another company", ctx do
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)

    assert {:error, :not_found} =
             ListBoards.call(ToolConnHelper.conn(ctx), %{"space_id" => Paths.space_id(foreign.space)})
  end
end
