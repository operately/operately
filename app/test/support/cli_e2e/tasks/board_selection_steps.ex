defmodule Operately.Support.CliE2E.Tasks.BoardSelectionSteps do
  use Operately.Support.CliE2E

  step :setup, ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_api_token(:api_token, :creator, read_only: false)
    result = run_cli(ctx, ["auth", "login", "--token", ctx.api_token, "--base-url", ctx.cli_base_url, "--profile", "e2e"])
    assert result.exit_code == 0, result.output
    ctx = Map.put(ctx, :profile, "e2e")
    ctx = Factory.set_space_tools(ctx, :space, tasks_enabled: true)
    ctx
  end

  step :given_another_board, ctx do
    board = Repo.insert!(%Operately.Tasks.TaskBoard{space_id: ctx.space.id, name: "Other", position: 1, task_statuses: Repo.get!(Operately.Tasks.TaskBoard, ctx.space.default_task_board_id).task_statuses})
    Map.put(ctx, :board, board)
  end

  step :create_board, ctx do
    payload = command!(ctx, ["tasks", "create_board", "--space-id", ctx.space.id, "--name", "Other"])
    board = Repo.get!(Operately.Tasks.TaskBoard, Operately.ShortUuid.decode!(payload["board"]["id"]))
    assert payload["board"]["is_default"] == false
    Map.put(ctx, :board, board)
  end

  step :rename_board, ctx do
    payload = command!(ctx, ["tasks", "rename_board", "--board-id", ctx.board.id, "--new-name", "Design"])
    assert payload["success"]
    assert Repo.reload!(ctx.board).name == "Design"
    ctx
  end

  step :assert_managed_boards_listed, ctx do
    payload = command!(ctx, ["tasks", "list_boards", "--space-id", ctx.space.id])
    assert [default, created] = payload["boards"]
    assert default["id"] == Operately.ShortUuid.encode!(ctx.space.default_task_board_id)
    assert default["is_default"]
    assert created["id"] == Operately.ShortUuid.encode!(ctx.board.id)
    assert created["name"] == "Design"
    refute created["is_default"]
    ctx
  end

  step :set_default_board, ctx do
    payload = command!(ctx, ["tasks", "set_default_board", "--space-id", ctx.space.id, "--board-id", ctx.board.id])
    assert payload["success"]
    space = Repo.reload!(ctx.space)
    assert space.default_task_board_id == ctx.board.id
    ctx |> Map.put(:previous_default_board_id, ctx.space.default_task_board_id) |> Map.put(:space, space)
  end

  step :assert_selected_default_listed, ctx do
    payload = command!(ctx, ["tasks", "list_boards", "--space-id", ctx.space.id])
    assert [default] = Enum.filter(payload["boards"], & &1["is_default"])
    assert default["id"] == Operately.ShortUuid.encode!(ctx.board.id)
    ctx
  end

  step :discover_boards, ctx do
    payload = command!(ctx, ["tasks", "list_boards", "--space-id", ctx.space.id])
    assert length(payload["boards"]) == 2
    selected = Enum.find(payload["boards"], &(not &1["is_default"]))
    assert selected["id"] == Operately.ShortUuid.encode!(ctx.board.id)
    Map.put(ctx, :selected_board_id, selected["id"])
  end

  step :create_task_on_selected_board, ctx do
    payload = command!(ctx, ["tasks", "create", "--type", "space", "--id", ctx.space.id, "--board-id", ctx.selected_board_id, "--name", "Selected", "--due-date", "null"])
    assert payload["task"]["board_id"] == ctx.selected_board_id
    Map.put(ctx, :task_id, payload["task"]["id"])
  end

  step :list_selected_board, ctx do
    payload = command!(ctx, ["spaces", "list_tasks", "--space-id", ctx.space.id, "--board-id", ctx.selected_board_id])
    assert [%{"id" => task_id}] = payload["tasks"]
    assert task_id == ctx.task_id
    ctx
  end

  step :move_task_to_default, ctx do
    payload = command!(ctx, ["tasks", "move", "--task-id", ctx.task_id, "--destination-type", "space", "--destination-id", ctx.space.id, "--destination-board-id", ctx.space.default_task_board_id])
    assert payload["task"]["board_id"] == Operately.ShortUuid.encode!(ctx.space.default_task_board_id)
    ctx
  end

  step :create_task_on_default_board, ctx do
    payload = command!(ctx, ["tasks", "create", "--type", "space", "--id", ctx.space.id, "--name", "Default", "--due-date", "null"])
    assert payload["task"]["board_id"] == Operately.ShortUuid.encode!(ctx.space.default_task_board_id)
    ctx
  end

  step :list_all_space_tasks, ctx do
    assert length((command!(ctx, ["spaces", "list_tasks", "--space-id", ctx.space.id]))["tasks"]) == 2
    ctx
  end

  step :archive_original_board, ctx do
    payload = command!(ctx, ["tasks", "archive_board", "--space-id", ctx.space.id, "--board-id", ctx.previous_default_board_id])
    assert payload["success"]
    ctx
  end

  step :assert_archived_board_listed, ctx do
    payload = command!(ctx, ["tasks", "list_boards", "--space-id", ctx.space.id, "--archive-status", "archived"])
    assert [board] = payload["boards"]
    assert board["id"] == Operately.ShortUuid.encode!(ctx.previous_default_board_id)
    assert board["archived_at"]
    refute board["is_default"]
    ctx
  end

  step :restore_original_board, ctx do
    payload = command!(ctx, ["tasks", "restore_board", "--space-id", ctx.space.id, "--board-id", ctx.previous_default_board_id])
    assert payload["success"]
    ctx
  end

  step :assert_restored_board_listed, ctx do
    payload = command!(ctx, ["tasks", "list_boards", "--space-id", ctx.space.id])
    assert [default, restored] = payload["boards"]
    assert default["id"] == Operately.ShortUuid.encode!(ctx.board.id)
    assert default["is_default"]
    assert restored["id"] == Operately.ShortUuid.encode!(ctx.previous_default_board_id)
    refute restored["is_default"]
    refute restored["archived_at"]
    ctx
  end

  step :archive_selected_board, ctx do
    ctx.board |> Ecto.Changeset.change(archived_at: ~N[2026-11-11 12:00:00]) |> Repo.update!()
    ctx
  end

  step :assert_archived_task_write_rejected, ctx do
    result = run_cli(ctx, ["tasks", "update_name", "--task-id", ctx.task_id, "--type", "space", "--name", "Blocked"])
    assert result.exit_code == 4, result.output
    [_, json] = String.split(result.output, "API request failed (400): ", parts: 2)
    error = Jason.decode!(String.trim(json))
    assert error["details"]["code"] == "task_board_archived"
    {:ok, task_id} = OperatelyWeb.Api.Types.Id.decode(ctx.task_id)
    assert Repo.get!(Operately.Tasks.Task, task_id).name == "Selected"
    ctx
  end

  step :assert_unavailable_default_details, ctx do
    ctx.space |> Ecto.Changeset.change(default_task_board_id: nil) |> Repo.update!()
    result = run_cli(ctx, ["tasks", "create", "--type", "space", "--id", ctx.space.id, "--name", "Missing", "--due-date", "null"])
    assert result.exit_code == 4, result.output
    [_, json] = String.split(result.output, "API request failed (400): ", parts: 2)
    error = Jason.decode!(String.trim(json))
    assert error["details"]["code"] == "default_task_board_unavailable"
    assert Enum.any?(error["details"]["candidates"], &(&1["id"] == ctx.selected_board_id))
    ctx
  end

  defp command!(ctx, args) do
    result = run_cli(ctx, args)
    assert result.exit_code == 0, result.output
    Jason.decode!(result.output)
  end
end
