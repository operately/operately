defmodule Operately.Support.McpE2E.Tools.BoardSelectionSteps do
  use Operately.McpE2ECase

  step :setup, ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.set_space_tools(ctx, :space, tasks_enabled: true)
    ctx
  end

  step :given_another_board, ctx do
    board = Repo.insert!(%Operately.Tasks.TaskBoard{space_id: ctx.space.id, name: "Other", position: 1, task_statuses: Repo.get!(Operately.Tasks.TaskBoard, ctx.space.default_task_board_id).task_statuses})
    Map.put(ctx, :board, board)
  end

  step :create_board, ctx do
    payload = call!(ctx, "create_task_board", %{"space_id" => ctx.space.id, "name" => "Other"})
    board = Repo.get!(Operately.Tasks.TaskBoard, Operately.ShortUuid.decode!(payload["board"]["id"]))
    assert payload["board"]["is_default"] == false
    Map.put(ctx, :board, board)
  end

  step :rename_board, ctx do
    payload = call!(ctx, "rename_task_board", %{"board_id" => ctx.board.id, "new_name" => "Design"})
    assert payload["success"]
    assert Repo.reload!(ctx.board).name == "Design"
    ctx
  end

  step :assert_managed_boards_listed, ctx do
    payload = call!(ctx, "list_task_boards", %{"space_id" => ctx.space.id})
    assert [default, created] = payload["boards"]
    assert default["id"] == Operately.ShortUuid.encode!(ctx.space.default_task_board_id)
    assert default["is_default"]
    assert created["id"] == Operately.ShortUuid.encode!(ctx.board.id)
    assert created["name"] == "Design"
    refute created["is_default"]
    ctx
  end

  step :set_default_board, ctx do
    payload = call!(ctx, "set_default_task_board", %{"space_id" => ctx.space.id, "board_id" => ctx.board.id})
    assert payload["success"]
    space = Repo.reload!(ctx.space)
    assert space.default_task_board_id == ctx.board.id
    ctx |> Map.put(:previous_default_board_id, ctx.space.default_task_board_id) |> Map.put(:space, space)
  end

  step :assert_selected_default_listed, ctx do
    payload = call!(ctx, "list_task_boards", %{"space_id" => ctx.space.id})
    assert [default] = Enum.filter(payload["boards"], & &1["is_default"])
    assert default["id"] == Operately.ShortUuid.encode!(ctx.board.id)
    ctx
  end

  step :discover_boards, ctx do
    payload = call!(ctx, "list_task_boards", %{"space_id" => ctx.space.id})
    assert length(payload["boards"]) == 2
    selected = Enum.find(payload["boards"], &(not &1["is_default"]))
    assert selected["id"] == Operately.ShortUuid.encode!(ctx.board.id)
    Map.put(ctx, :selected_board_id, selected["id"])
  end

  step :create_task_on_selected_board, ctx do
    payload = call!(ctx, "create_task", %{"space_id" => ctx.space.id, "board_id" => ctx.selected_board_id, "name" => "Selected"})
    assert payload["task"]["board_id"] == ctx.selected_board_id
    Map.put(ctx, :task_id, payload["task"]["id"])
  end

  step :list_selected_board, ctx do
    payload = call!(ctx, "list_tasks", %{"space_id" => ctx.space.id, "board_id" => ctx.selected_board_id})
    assert [%{"id" => task_id}] = payload["tasks"]
    assert task_id == ctx.task_id
    ctx
  end

  step :move_task_to_default, ctx do
    payload = call!(ctx, "move_task", %{"task_id" => ctx.task_id, "destination_type" => "space", "destination_id" => ctx.space.id, "destination_board_id" => ctx.space.default_task_board_id})
    assert payload["task"]["board_id"] == Operately.ShortUuid.encode!(ctx.space.default_task_board_id)
    ctx
  end

  step :create_task_on_default_board, ctx do
    payload = call!(ctx, "create_task", %{"space_id" => ctx.space.id, "name" => "Default"})
    assert payload["task"]["board_id"] == Operately.ShortUuid.encode!(ctx.space.default_task_board_id)
    ctx
  end

  step :list_all_space_tasks, ctx do
    assert length((call!(ctx, "list_tasks", %{"space_id" => ctx.space.id}))["tasks"]) == 2
    ctx
  end

  step :archive_original_board, ctx do
    payload = call!(ctx, "archive_task_board", %{"space_id" => ctx.space.id, "board_id" => ctx.previous_default_board_id})
    assert payload["success"]
    ctx
  end

  step :assert_archived_board_listed, ctx do
    payload = call!(ctx, "list_task_boards", %{"space_id" => ctx.space.id, "archive_status" => "archived"})
    assert [board] = payload["boards"]
    assert board["id"] == Operately.ShortUuid.encode!(ctx.previous_default_board_id)
    assert board["archived_at"]
    refute board["is_default"]
    ctx
  end

  step :restore_original_board, ctx do
    payload = call!(ctx, "restore_task_board", %{"space_id" => ctx.space.id, "board_id" => ctx.previous_default_board_id})
    assert payload["success"]
    ctx
  end

  step :assert_restored_board_listed, ctx do
    payload = call!(ctx, "list_task_boards", %{"space_id" => ctx.space.id})
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
    conn = call_tool(ctx.access_token, ctx.session_id, "update_task_name", %{"task_id" => ctx.task_id, "name" => "Blocked"})
    result = json_body(conn)["result"]
    assert result["isError"]
    error = result["structuredContent"]
    assert error["details"]["code"] == "task_board_archived"
    {:ok, task_id} = OperatelyWeb.Api.Types.Id.decode(ctx.task_id)
    assert Repo.get!(Operately.Tasks.Task, task_id).name == "Selected"
    ctx
  end

  step :assert_unavailable_default_details, ctx do
    ctx.space |> Ecto.Changeset.change(default_task_board_id: nil) |> Repo.update!()
    conn = call_tool(ctx.access_token, ctx.session_id, "create_task", %{"space_id" => ctx.space.id, "name" => "Missing"})
    result = json_body(conn)["result"]
    assert result["isError"]
    error = result["structuredContent"]
    assert error["details"]["code"] == "default_task_board_unavailable"
    assert Enum.any?(error["details"]["candidates"], &(&1["id"] == ctx.selected_board_id))
    ctx
  end

  step :edit_project_board_workflow, ctx do
    ctx = Factory.add_project(ctx, :project, :space)
    board = call!(ctx, "get_task_board", %{"project_id" => ctx.project.id})["board"]
    statuses = Enum.map(board["task_statuses"], &Map.take(&1, ["id", "label", "color", "index", "value", "closed"]))
    statuses = List.update_at(statuses, 0, &Map.put(&1, "label", "Ready"))
    assert call!(ctx, "update_task_board_statuses", %{"board_id" => board["id"], "task_statuses" => statuses})["success"]
    task = call!(ctx, "create_task", %{"project_id" => ctx.project.id, "name" => "Project task"})["task"]
    assert task["board_id"] == board["id"]
    assert task["status"]["label"] == "Ready"
    assert [%{"id" => id}] = call!(ctx, "list_tasks", %{"board_id" => board["id"]})["tasks"]
    assert id == task["id"]
    ctx
  end

  defp call!(ctx, name, arguments) do
    conn = call_tool(ctx.access_token, ctx.session_id, name, arguments)
    assert conn.status == 200
    result = json_body(conn)["result"]
    refute result["isError"], inspect(result)
    result["structuredContent"]
  end
end
