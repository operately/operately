defmodule OperatelyWeb.Api.Tasks.ListBoardsTest do
  use OperatelyWeb.TurboCase
  alias Operately.Tasks.TaskBoard

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.log_in_person(:creator)
  end

  test "lists ordered summaries and filters archived boards", ctx do
    other = Repo.insert!(%TaskBoard{space_id: ctx.space.id, name: "Other", position: 1})
    archived = Repo.insert!(%TaskBoard{space_id: ctx.space.id, name: "Archived", position: 2, archived_at: ~N[2026-01-01 00:00:00]})

    assert {200, %{boards: boards}} = query(ctx.conn, [:tasks, :list_boards], %{space_id: Paths.space_id(ctx.space)})
    assert Enum.map(boards, & &1.id) == Enum.map([ctx.space.default_task_board_id, other.id], &Operately.ShortUuid.encode!/1)
    assert Enum.map(boards, & &1.is_default) == [true, false]
    refute Map.has_key?(hd(boards), :tasks)

    assert {200, %{boards: [board]}} = query(ctx.conn, [:tasks, :list_boards], %{space_id: Paths.space_id(ctx.space), archive_status: "archived"})
    assert board.id == Operately.ShortUuid.encode!(archived.id)
    assert {200, %{boards: all}} = query(ctx.conn, [:tasks, :list_boards], %{space_id: Paths.space_id(ctx.space), archive_status: "all"})
    assert length(all) == 3
  end

  test "requires authentication", ctx do
    ctx = %{ctx | conn: Phoenix.ConnTest.build_conn()}
    assert {401, _} = query(ctx.conn, [:tasks, :list_boards], %{space_id: Paths.space_id(ctx.space)})
  end

  test "does not expose private or cross-company boards", ctx do
    ctx = ctx |> Factory.add_space(:private, company_permissions: Operately.Access.Binding.no_access()) |> Factory.add_company_member(:outsider) |> Factory.log_in_person(:outsider)
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)

    for space <- [ctx.private, foreign.space] do
      assert {404, _} = query(ctx.conn, [:tasks, :list_boards], %{space_id: space.id})
      assert {404, _} = query(ctx.conn, [:tasks, :list_task_statuses], %{board_id: space.default_task_board_id})
      assert {404, _} = query(ctx.conn, [:spaces, :list_tasks], %{space_id: ctx.space.id, board_id: space.default_task_board_id})
    end
  end

  test "discovery works with the task category disabled", ctx do
    ctx = Factory.set_space_tools(ctx, :space, tasks_enabled: false)
    assert {200, %{boards: [_]}} = query(ctx.conn, [:tasks, :list_boards], %{space_id: ctx.space.id})
  end
end
