defmodule OperatelyWeb.Api.Tasks.RenameBoardTest do
  use OperatelyWeb.TurboCase
  import Ecto.Query
  alias Operately.Tasks.TaskBoard
  alias Operately.Access.Binding

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_space(:space, company_permissions: 0) |> Factory.log_in_person(:creator)
  end

  test "rejects renaming an archived board", ctx do
    board = Repo.get!(TaskBoard, ctx.space.default_task_board_id)
    board |> Ecto.Changeset.change(archived_at: ~N[2026-11-11 12:00:00]) |> Repo.update!()
    assert {400, %{details: %{code: "task_board_archived"}}} = mutation(ctx.conn, [:tasks, :rename_board], inputs(ctx))
    assert Repo.reload!(board).name == board.name
  end

  test "requires authentication", ctx do
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:tasks, :rename_board], inputs(ctx))
  end

  for {level, expected} <- [{:no_access, 404}, {:view_access, 403}, {:comment_access, 403}, {:edit_access, 200}] do
    test "requires space edit access: #{level}", ctx do
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:member)
      grant_access(ctx, unquote(level))
      assert {unquote(expected), _} = mutation(ctx.conn, [:tasks, :rename_board], inputs(ctx))
    end
  end

  test "rejects another company and read-only company writes", ctx do
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)
    assert {404, _} = mutation(ctx.conn, [:tasks, :rename_board], inputs(foreign))
    {:ok, account} = Operately.Billing.get_or_create_billing_account(ctx.company)
    {:ok, _} = Operately.Billing.update_billing_account(account, %{access_state: :read_only, access_state_reason: :past_due, access_state_started_at: DateTime.utc_now()})
    assert {403, _} = mutation(ctx.conn, [:tasks, :rename_board], inputs(ctx))
  end

  test "renames the default with Tasks disabled and records only actual changes", ctx do
    ctx = Factory.set_space_tools(ctx, :space, tasks_enabled: false)
    board = Repo.get!(TaskBoard, ctx.space.default_task_board_id)
    inputs = %{board_id: board.id, new_name: "  Design  "}
    assert {200, %{success: true}} = mutation(ctx.conn, [:tasks, :rename_board], inputs)
    assert {200, _} = mutation(ctx.conn, [:tasks, :rename_board], inputs)
    assert Repo.reload!(board).name == "Design"
    assert Repo.reload!(ctx.space).default_task_board_id == board.id
    assert [activity] = Repo.all(from a in Operately.Activities.Activity, where: a.action == "task_board_renamed")
    assert activity.content["old_name"] == board.name
    assert activity.content["new_name"] == "Design"
    assert {400, %{message: "Name is required", details: %{field: "new_name"}}} = mutation(ctx.conn, [:tasks, :rename_board], %{inputs | new_name: " "})
    assert Repo.reload!(board).name == "Design"
  end

  test "accepts 255 characters and rejects longer names without changing records", ctx do
    name = String.duplicate("é", 255)
    inputs = %{board_id: ctx.space.default_task_board_id, new_name: name}
    assert {200, _} = mutation(ctx.conn, [:tasks, :rename_board], inputs)
    board = Repo.get!(TaskBoard, inputs.board_id)
    assert board.name == name
    activity_count = Repo.aggregate(Operately.Activities.Activity, :count)

    for name <- [String.duplicate("a", 256), String.duplicate("e\u0301", 128)] do
      assert {400, error} = mutation(ctx.conn, [:tasks, :rename_board], %{inputs | new_name: name})
      assert error.message == "should be at most 255 character(s)"
      assert error.details.field == "new_name"
      assert Repo.reload!(board) == board
      assert Repo.aggregate(Operately.Activities.Activity, :count) == activity_count
    end
  end

  defp grant_access(_ctx, :no_access), do: :ok
  defp grant_access(ctx, level) do
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: ctx.member.id, access_level: Binding.from_atom(level)}])
  end

  defp inputs(ctx), do: %{board_id: ctx.space.default_task_board_id, new_name: "Design"}
end
