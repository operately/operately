defmodule OperatelyWeb.Api.Tasks.ReorderBoardsTest do
  use OperatelyWeb.TurboCase
  alias Operately.Tasks.TaskBoard
  alias Operately.Access.Binding

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_space(:space, company_permissions: 0) |> Factory.log_in_person(:creator)
  end

  test "requires authentication", ctx do
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:tasks, :reorder_boards], inputs(ctx))
  end

  for {level, expected} <- [{:no_access, 404}, {:view_access, 403}, {:comment_access, 403}, {:edit_access, 200}] do
    test "requires space edit access: #{level}", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:member)
      grant_access(ctx, unquote(level))
      assert {unquote(expected), _} = mutation(ctx.conn, [:tasks, :reorder_boards], inputs(ctx))
    end
  end

  test "rejects another company and read-only company writes", ctx do
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)
    assert {404, _} = mutation(ctx.conn, [:tasks, :reorder_boards], inputs(foreign))
    {:ok, account} = Operately.Billing.get_or_create_billing_account(ctx.company)
    {:ok, _} = Operately.Billing.update_billing_account(account, %{access_state: :read_only, access_state_reason: :past_due, access_state_started_at: DateTime.utc_now()})
    assert {403, _} = mutation(ctx.conn, [:tasks, :reorder_boards], inputs(ctx))
  end

  test "orders every active board without changing defaults or archived positions", ctx do
    ctx = Factory.set_space_tools(ctx, :space, tasks_enabled: false)
    board = Repo.insert!(%TaskBoard{space_id: ctx.space.id, name: "Other", position: 1})
    archived = Repo.insert!(%TaskBoard{space_id: ctx.space.id, name: "Archived", position: 7, archived_at: ~N[2026-01-01 00:00:00]})
    assert {200, _} = mutation(ctx.conn, [:tasks, :reorder_boards], %{space_id: ctx.space.id, board_ids: [board.id, ctx.space.default_task_board_id]})
    assert Repo.reload!(board).position == 0
    assert Repo.get!(TaskBoard, ctx.space.default_task_board_id).position == 1
    assert Repo.reload!(archived).position == 7
    assert Repo.reload!(ctx.space).default_task_board_id == ctx.space.default_task_board_id

    ctx = Factory.add_space(ctx, :other_space)
    for ids <- [[], [board.id], [board.id, board.id], [board.id, ctx.other_space.default_task_board_id], [board.id, ctx.space.default_task_board_id, archived.id]] do
      assert {400, %{details: %{code: "invalid_task_board_order"}}} = mutation(ctx.conn, [:tasks, :reorder_boards], %{space_id: ctx.space.id, board_ids: ids})
    end
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)
    assert {404, _} = mutation(ctx.conn, [:tasks, :reorder_boards], %{space_id: ctx.space.id, board_ids: [foreign.space.default_task_board_id]})
    assert Repo.reload!(board).position == 0
  end

  defp grant_access(_ctx, :no_access), do: :ok
  defp grant_access(ctx, level) do
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: ctx.member.id, access_level: Binding.from_atom(level)}])
  end

  defp inputs(ctx), do: %{space_id: ctx.space.id, board_ids: [ctx.space.default_task_board_id]}
end
