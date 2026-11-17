defmodule OperatelyWeb.Api.Tasks.SetDefaultBoardTest do
  use OperatelyWeb.TurboCase
  import Ecto.Query
  alias Operately.Access.Binding
  alias Operately.Tasks.TaskBoard

  setup ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space, company_permissions: 0) |> Factory.log_in_person(:creator)
    {:ok, board} = Operately.Operations.TaskBoardCreating.run(ctx.creator, ctx.space, "Other")
    Map.put(ctx, :board, board)
  end

  test "requires authentication", ctx do
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:tasks, :set_default_board], inputs(ctx))
  end

  for {level, expected} <- [{:no_access, 404}, {:view_access, 403}, {:comment_access, 403}, {:edit_access, 200}] do
    test "requires space edit access: #{level}", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:member)
      grant_access(ctx, unquote(level))
      assert {unquote(expected), _} = mutation(ctx.conn, [:tasks, :set_default_board], inputs(ctx))
    end
  end

  test "rejects inaccessible resources before checking ownership", ctx do
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)
    assert {404, _} = mutation(ctx.conn, [:tasks, :set_default_board], %{space_id: ctx.space.id, board_id: foreign.space.default_task_board_id})
    assert {404, _} = mutation(ctx.conn, [:tasks, :set_default_board], %{space_id: foreign.space.id, board_id: ctx.board.id})
    assert Repo.reload!(ctx.space).default_task_board_id == ctx.space.default_task_board_id
  end

  test "rejects a board in another accessible space", ctx do
    ctx = Factory.add_space(ctx, :other_space)
    assert {400, _} = mutation(ctx.conn, [:tasks, :set_default_board], %{space_id: ctx.space.id, board_id: ctx.other_space.default_task_board_id})
    assert Repo.reload!(ctx.space).default_task_board_id == ctx.space.default_task_board_id
  end

  test "rejects archived boards and read-only company writes", ctx do
    ctx.board |> Ecto.Changeset.change(archived_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)) |> Repo.update!()
    assert {400, %{details: %{code: "task_board_archived"}}} = mutation(ctx.conn, [:tasks, :set_default_board], inputs(ctx))
    {:ok, account} = Operately.Billing.get_or_create_billing_account(ctx.company)
    {:ok, _} = Operately.Billing.update_billing_account(account, %{access_state: :read_only, access_state_reason: :past_due, access_state_started_at: DateTime.utc_now()})
    assert {403, _} = mutation(ctx.conn, [:tasks, :set_default_board], %{space_id: ctx.space.id, board_id: ctx.space.default_task_board_id})
    assert Repo.reload!(ctx.space).default_task_board_id == ctx.space.default_task_board_id
  end

  test "changes the default with Tasks disabled and records only actual changes", ctx do
    ctx = Factory.set_space_tools(ctx, :space, tasks_enabled: false)
    assert {200, %{success: true}} = mutation(ctx.conn, [:tasks, :set_default_board], inputs(ctx))
    assert {200, %{success: true}} = mutation(ctx.conn, [:tasks, :set_default_board], inputs(ctx))
    assert Repo.reload!(ctx.space).default_task_board_id == ctx.board.id
    assert [activity] = Repo.all(from a in Operately.Activities.Activity, where: a.action == "task_board_default_changed")
    assert activity.content["previous_board_id"] == ctx.space.default_task_board_id
    assert activity.content["board_id"] == ctx.board.id
    assert activity.content["name"] == ctx.board.name

    assert {200, %{boards: boards}} = query(ctx.conn, [:tasks, :list_boards], %{space_id: ctx.space.id})
    assert Enum.map(Enum.filter(boards, & &1.is_default), & &1.id) == [Operately.ShortUuid.encode!(ctx.board.id)]
  end

  test "space-only creation, status updates, and ordering follow the selected default", ctx do
    ctx = Factory.set_space_tools(ctx, :space, tasks_enabled: true)
    original = Repo.get!(TaskBoard, ctx.space.default_task_board_id)
    assert {200, _} = mutation(ctx.conn, [:tasks, :set_default_board], inputs(ctx))

    assert {200, %{task: task}} = mutation(ctx.conn, [:tasks, :create], %{type: "space", id: ctx.space.id, name: "New task", due_date: nil})
    assert task.board_id == Operately.ShortUuid.encode!(ctx.board.id)

    statuses = Enum.map(ctx.board.task_statuses, fn status ->
      status |> Map.from_struct() |> Map.update!(:color, &to_string/1) |> Map.put(:label, "Selected board")
    end)
    assert {200, response} = mutation(ctx.conn, [:spaces, :update_task_statuses], %{space_id: ctx.space.id, task_statuses: statuses})
    assert response.board_id == task.board_id
    status = hd(statuses)
    assert {200, response} = mutation(ctx.conn, [:spaces, :update_kanban], %{
      space_id: ctx.space.id, task_id: task.id, status: status, kanban_state: Jason.encode!(%{status.value => [task.id]})
    })
    assert response.board_id == task.board_id
    assert Repo.reload!(original) == original

    assert {200, %{space: space}} = query(ctx.conn, [:spaces, :get], %{id: ctx.space.id})
    assert space.default_task_board_id == task.board_id
    assert Enum.all?(space.task_statuses, &(&1.label == "Selected board"))
  end

  test "keeps existing tasks on their boards and uses the new default for move destinations", ctx do
    ctx =
      ctx
      |> Factory.set_space_tools(:space, tasks_enabled: true)
      |> Factory.create_space_task(:existing_task, :space)
      |> Factory.add_space(:source_space)
      |> Factory.create_space_task(:moving_task, :source_space)
    assert {200, _} = mutation(ctx.conn, [:tasks, :set_default_board], inputs(ctx))
    assert Repo.reload!(ctx.existing_task).board_id == ctx.space.default_task_board_id

    assert {200, %{task: task}} = mutation(ctx.conn, [:tasks, :move], %{task_id: ctx.moving_task.id, destination_type: "space", destination_id: ctx.space.id})
    assert task.board_id == Operately.ShortUuid.encode!(ctx.board.id)
    assert {200, %{tasks: tasks}} = query(ctx.conn, [:spaces, :list_tasks], %{space_id: ctx.space.id})
    assert length(tasks) == 2
  end

  test "rejects project boards", ctx do
    ctx = Factory.add_project(ctx, :project, :space)
    board = Operately.Projects.Project.task_board(ctx.project)
    assert {400, _} = mutation(ctx.conn, [:tasks, :set_default_board], %{space_id: ctx.space.id, board_id: board.id})
  end

  defp inputs(ctx), do: %{space_id: ctx.space.id, board_id: ctx.board.id}

  defp grant_access(_ctx, :no_access), do: :ok
  defp grant_access(ctx, level) do
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: ctx.member.id, access_level: Binding.from_atom(level)}])
  end
end
