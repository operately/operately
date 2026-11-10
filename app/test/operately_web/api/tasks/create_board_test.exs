defmodule OperatelyWeb.Api.Tasks.CreateBoardTest do
  use OperatelyWeb.TurboCase
  alias Operately.Tasks.TaskBoard
  alias Operately.Access.Binding

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_space(:space, company_permissions: 0) |> Factory.log_in_person(:creator)
  end

  test "requires authentication", ctx do
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:tasks, :create_board], inputs(ctx))
  end

  for {level, expected} <- [{:no_access, 404}, {:view_access, 403}, {:comment_access, 403}, {:edit_access, 200}] do
    test "requires space edit access: #{level}", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:member)
      grant_access(ctx, unquote(level))
      assert {unquote(expected), _} = mutation(ctx.conn, [:tasks, :create_board], inputs(ctx))
    end
  end

  test "rejects another company and read-only company writes", ctx do
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)
    assert {404, _} = mutation(ctx.conn, [:tasks, :create_board], inputs(foreign))
    {:ok, account} = Operately.Billing.get_or_create_billing_account(ctx.company)
    {:ok, _} = Operately.Billing.update_billing_account(account, %{access_state: :read_only, access_state_reason: :past_due, access_state_started_at: DateTime.utc_now()})
    assert {403, _} = mutation(ctx.conn, [:tasks, :create_board], inputs(ctx))
  end

  test "appends independent boards with Tasks disabled and preserves the default", ctx do
    ctx = Factory.set_space_tools(ctx, :space, tasks_enabled: false)
    original = Repo.get!(TaskBoard, ctx.space.default_task_board_id)
    Repo.insert!(%TaskBoard{space_id: ctx.space.id, name: "Archived", position: 99, archived_at: ~N[2026-01-01 00:00:00]})

    assert {200, %{board: summary}} = mutation(ctx.conn, [:tasks, :create_board], %{space_id: ctx.space.id, name: "  Design  "})
    board = Repo.get!(TaskBoard, Operately.ShortUuid.decode!(summary.id))
    assert summary.name == "Design"
    assert summary.position == 1
    refute summary.is_default
    assert Enum.map(board.task_statuses, & &1.id) -- Enum.map(original.task_statuses, & &1.id) == Enum.map(board.task_statuses, & &1.id)
    assert Enum.map(board.task_statuses, & &1.value) == Enum.map(original.task_statuses, & &1.value)
    assert Enum.all?(Map.values(board.tasks_kanban_state), &(&1 == []))
    assert Repo.reload!(ctx.space).default_task_board_id == original.id
    assert Repo.reload!(original).tasks_kanban_state == original.tasks_kanban_state
    assert Repo.get_by!(Operately.Activities.Activity, action: "task_board_created").content["board_id"] == board.id
  end

  test "blank names do not create boards or activities", ctx do
    count = Repo.aggregate(TaskBoard, :count)
    assert {400, _} = mutation(ctx.conn, [:tasks, :create_board], %{space_id: ctx.space.id, name: "   "})
    assert Repo.aggregate(TaskBoard, :count) == count
    refute Repo.get_by(Operately.Activities.Activity, action: "task_board_created")
  end

  defp grant_access(_ctx, :no_access), do: :ok
  defp grant_access(ctx, level) do
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: ctx.member.id, access_level: Binding.from_atom(level)}])
  end

  defp inputs(ctx), do: %{space_id: ctx.space.id, name: "Design"}
end
