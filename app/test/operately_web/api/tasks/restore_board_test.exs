defmodule OperatelyWeb.Api.Tasks.RestoreBoardTest do
  use OperatelyWeb.TurboCase
  import Ecto.Query
  alias Operately.Access.Binding

  setup ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space, company_permissions: 0) |> Factory.log_in_person(:creator)
    {:ok, board} = Operately.Operations.TaskBoardCreating.run(ctx.creator, ctx.space, "Other")
    board |> Ecto.Changeset.change(archived_at: ~N[2026-11-11 12:00:00]) |> Repo.update!()
    Map.put(ctx, :board, board)
  end

  test "requires authentication", ctx do
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:tasks, :restore_board], inputs(ctx))
  end

  for {level, expected} <- [{:no_access, 404}, {:view_access, 403}, {:comment_access, 403}, {:edit_access, 200}] do
    test "requires space edit access: #{level}", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:member)
      grant_access(ctx, unquote(level))
      assert {unquote(expected), _} = mutation(ctx.conn, [:tasks, :restore_board], inputs(ctx))
    end
  end

  test "authorizes before validating ownership and rejects company read-only writes", ctx do
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)

    assert {404, _} = mutation(ctx.conn, [:tasks, :restore_board], %{space_id: ctx.space.id, board_id: foreign.space.default_task_board_id})
    assert {404, _} = mutation(ctx.conn, [:tasks, :restore_board], %{space_id: foreign.space.id, board_id: ctx.board.id})

    ctx = Factory.add_space(ctx, :other_space)

    assert {400, _} = mutation(ctx.conn, [:tasks, :restore_board], %{space_id: ctx.other_space.id, board_id: ctx.board.id})
    {:ok, account} = Operately.Billing.get_or_create_billing_account(ctx.company)
    {:ok, _} = Operately.Billing.update_billing_account(account, %{access_state: :read_only, access_state_reason: :past_due, access_state_started_at: DateTime.utc_now()})
    assert {403, _} = mutation(ctx.conn, [:tasks, :restore_board], inputs(ctx))
  end

  test "appends once, preserves content and default, and works with Tasks disabled", ctx do
    ctx = Factory.set_space_tools(ctx, :space, tasks_enabled: false)
    {:ok, last} = Operately.Operations.TaskBoardCreating.run(ctx.creator, ctx.space, "Last")
    before = Repo.reload!(ctx.board)

    assert {200, %{success: true}} = mutation(ctx.conn, [:tasks, :restore_board], inputs(ctx))
    restored = Repo.reload!(ctx.board)
    assert is_nil(restored.archived_at)
    assert restored.position == last.position + 1
    assert restored.tasks_kanban_state == before.tasks_kanban_state
    assert restored.task_statuses == before.task_statuses

    assert Repo.reload!(ctx.space).default_task_board_id == ctx.space.default_task_board_id
    assert {200, %{success: true}} = mutation(ctx.conn, [:tasks, :restore_board], inputs(ctx))

    assert Repo.reload!(ctx.board) == restored
    assert [activity] = Repo.all(from a in Operately.Activities.Activity, where: a.action == "task_board_restored")
    assert activity.content["board_id"] == ctx.board.id
    assert {200, %{boards: boards}} = query(ctx.conn, [:tasks, :list_boards], %{space_id: ctx.space.id})
    assert List.last(boards).id == Operately.ShortUuid.encode!(ctx.board.id)
  end

  test "rejects project boards", ctx do
    ctx = Factory.add_project(ctx, :project, :space)
    board = Operately.Projects.Project.task_board(ctx.project)
    assert {400, _} = mutation(ctx.conn, [:tasks, :restore_board], %{space_id: ctx.space.id, board_id: board.id})
  end

  defp grant_access(_ctx, :no_access), do: :ok
  defp grant_access(ctx, level) do
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: ctx.member.id, access_level: Binding.from_atom(level)}])
  end

  defp inputs(ctx), do: %{space_id: ctx.space.id, board_id: ctx.board.id}
end
