defmodule Operately.Support.McpE2E.Tools.BoardSelectionSteps do
  use Operately.McpE2ECase

  step :setup, ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.set_space_tools(ctx, :space, tasks_enabled: true)
    board = Repo.insert!(%Operately.Tasks.TaskBoard{space_id: ctx.space.id, name: "Other", position: 1, task_statuses: ctx.space.task_statuses})
    Map.put(ctx, :board, board)
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

  defp call!(ctx, name, arguments) do
    conn = call_tool(ctx.access_token, ctx.session_id, name, arguments)
    assert conn.status == 200
    result = json_body(conn)["result"]
    refute result["isError"], inspect(result)
    result["structuredContent"]
  end
end
