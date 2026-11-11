defmodule OperatelyWeb.Api.Tasks.ArchiveBoardTest do
  use OperatelyWeb.TurboCase
  import Ecto.Query
  alias Operately.Tasks.TaskBoard
  alias Operately.Access.Binding

  setup ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space, company_permissions: 0) |> Factory.log_in_person(:creator)
    {:ok, board} = Operately.Operations.TaskBoardCreating.run(ctx.creator, ctx.space, "Other")
    Map.put(ctx, :board, board)
  end

  test "requires authentication", ctx do
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:tasks, :archive_board], inputs(ctx))
  end

  for {level, expected} <- [{:no_access, 404}, {:view_access, 403}, {:comment_access, 403}, {:edit_access, 200}] do
    test "requires space edit access: #{level}", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:member)
      grant_access(ctx, unquote(level))
      assert {unquote(expected), _} = mutation(ctx.conn, [:tasks, :archive_board], inputs(ctx))
    end
  end

  test "authorizes before validating ownership and rejects company read-only writes", ctx do
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)

    assert {404, _} = mutation(ctx.conn, [:tasks, :archive_board], %{space_id: ctx.space.id, board_id: foreign.space.default_task_board_id})
    assert {404, _} = mutation(ctx.conn, [:tasks, :archive_board], %{space_id: foreign.space.id, board_id: ctx.board.id})

    ctx = Factory.add_space(ctx, :other_space)
    assert {400, _} = mutation(ctx.conn, [:tasks, :archive_board], %{space_id: ctx.other_space.id, board_id: ctx.board.id})

    {:ok, account} = Operately.Billing.get_or_create_billing_account(ctx.company)
    {:ok, _} = Operately.Billing.update_billing_account(account, %{access_state: :read_only, access_state_reason: :past_due, access_state_started_at: DateTime.utc_now()})

    assert {403, _} = mutation(ctx.conn, [:tasks, :archive_board], inputs(ctx))
  end

  test "archives nonempty boards with Tasks disabled, keeps tasks and ordering, and is idempotent", ctx do
    ctx = ctx |> Factory.set_space_tools(:space, tasks_enabled: false) |> Factory.create_space_task(:task, :space, board_id: ctx.board.id)
    before = Repo.reload!(ctx.board)
    task = Repo.reload!(ctx.task)

    assert {200, %{success: true}} = mutation(ctx.conn, [:tasks, :archive_board], inputs(ctx))

    archived = Repo.reload!(ctx.board)
    assert archived.archived_at

    assert {200, %{success: true}} = mutation(ctx.conn, [:tasks, :archive_board], inputs(ctx))

    assert Repo.reload!(ctx.board) == archived
    assert Repo.reload!(ctx.task) == task
    assert archived.tasks_kanban_state == before.tasks_kanban_state
    assert archived.task_statuses == before.task_statuses
    assert Repo.reload!(ctx.space).default_task_board_id == ctx.space.default_task_board_id
    assert [activity] = Repo.all(from a in Operately.Activities.Activity, where: a.action == "task_board_archived")
    assert activity.content["board_id"] == ctx.board.id
    assert activity.access_context_id == Operately.Access.get_context(group_id: ctx.space.id).id

    assert {200, %{boards: [active]}} = query(ctx.conn, [:tasks, :list_boards], %{space_id: ctx.space.id})
    assert active.is_default

    assert {200, %{boards: [archived]}} = query(ctx.conn, [:tasks, :list_boards], %{space_id: ctx.space.id, archive_status: "archived"})
    assert archived.id == Operately.ShortUuid.encode!(ctx.board.id)

    assert {200, %{task: _}} = query(ctx.conn, [:tasks, :get], %{id: task.id})
  end

  test "rejects archiving the default, including when it is the last active board", ctx do
    default_inputs = %{space_id: ctx.space.id, board_id: ctx.space.default_task_board_id}

    assert {400, %{details: %{code: "default_task_board_archive_forbidden"}}} = mutation(ctx.conn, [:tasks, :archive_board], default_inputs)
    assert {200, _} = mutation(ctx.conn, [:tasks, :archive_board], inputs(ctx))
    assert {400, %{details: %{code: "default_task_board_archive_forbidden"}}} = mutation(ctx.conn, [:tasks, :archive_board], default_inputs)

    assert Repo.reload!(ctx.space).default_task_board_id == ctx.space.default_task_board_id
    assert is_nil(Repo.get!(TaskBoard, ctx.space.default_task_board_id).archived_at)
    refute Repo.exists?(from a in Operately.Activities.Activity, where: a.action == "task_board_default_changed")
  end

  test "allows archiving a former default after selecting another default", ctx do
    assert {200, _} = mutation(ctx.conn, [:tasks, :set_default_board], inputs(ctx))
    assert {200, _} = mutation(ctx.conn, [:tasks, :archive_board], %{space_id: ctx.space.id, board_id: ctx.space.default_task_board_id})
    assert Repo.reload!(ctx.space).default_task_board_id == ctx.board.id
    assert Repo.get!(TaskBoard, ctx.space.default_task_board_id).archived_at
    assert [_] = Repo.all(from a in Operately.Activities.Activity, where: a.action == "task_board_default_changed")
  end

  defp grant_access(_ctx, :no_access), do: :ok
  defp grant_access(ctx, level) do
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: ctx.member.id, access_level: Binding.from_atom(level)}])
  end

  defp inputs(ctx), do: %{space_id: ctx.space.id, board_id: ctx.board.id}
end
