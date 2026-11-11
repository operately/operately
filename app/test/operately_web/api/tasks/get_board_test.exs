defmodule OperatelyWeb.Api.Tasks.GetBoardTest do
  use OperatelyWeb.TurboCase
  alias Operately.Tasks.TaskBoard

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.log_in_person(:creator)
  end

  test "reads the selected board, including archived boards", ctx do
    default = Repo.get!(TaskBoard, ctx.space.default_task_board_id)
    board = Repo.insert!(%TaskBoard{space_id: ctx.space.id, name: "Support", task_statuses: default.task_statuses, archived_at: ~N[2026-01-01 00:00:00]})

    assert {200, %{board: result}} = query(ctx.conn, [:tasks, :get_board], %{space_id: ctx.space.id, board_id: board.id})
    assert result.id == Operately.ShortUuid.encode!(board.id)
    assert result.name == "Support"
    assert result.archived_at
    assert Enum.map(result.task_statuses, & &1.id) == Enum.map(default.task_statuses, & &1.id)
  end

  test "rejects mismatched spaces and hides inaccessible boards", ctx do
    ctx = Factory.add_space(ctx, :other)
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)

    assert {400, _} = query(ctx.conn, [:tasks, :get_board], %{space_id: ctx.space.id, board_id: ctx.other.default_task_board_id})
    assert {404, _} = query(ctx.conn, [:tasks, :get_board], %{space_id: ctx.space.id, board_id: foreign.space.default_task_board_id})

    ctx = ctx |> Factory.add_space(:private, company_permissions: Operately.Access.Binding.no_access()) |> Factory.add_company_member(:outsider) |> Factory.log_in_person(:outsider)
    assert {404, _} = query(ctx.conn, [:tasks, :get_board], %{space_id: ctx.private.id, board_id: ctx.private.default_task_board_id})
  end

  test "requires authentication", ctx do
    assert {401, _} = query(Phoenix.ConnTest.build_conn(), [:tasks, :get_board], %{space_id: ctx.space.id, board_id: ctx.space.default_task_board_id})
  end
end
