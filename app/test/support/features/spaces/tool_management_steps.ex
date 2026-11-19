defmodule Operately.Support.Features.Spaces.ToolManagementSteps do
  use Operately.FeatureCase

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, name: "Marketing")
    |> Factory.enable_space_tool(:space, :tasks)
    |> Factory.log_in_person(:creator)
  end

  step :given_another_board, ctx do
    {:ok, board} = Operately.Operations.TaskBoardCreating.run(ctx.creator, ctx.space, "Campaigns")
    Map.put(ctx, :board, board)
  end

  step :visit_space, ctx do
    ctx |> UI.visit(Paths.space_path(ctx.company, ctx.space)) |> UI.assert_has(testid: "space-page")
  end

  step :leave_configuration, ctx do
    ctx |> UI.click(testid: "cancel") |> UI.assert_has(testid: "space-page")
  end

  step :visit_configuration, ctx do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space) <> "/tools-config")
    |> UI.assert_has(testid: "tool-management")
  end

  step :toggle_category, ctx, testid do
    UI.click(ctx, testid: testid)
  end

  step :create_tool, ctx, {kind, name} do
    ctx
    |> UI.click(testid: "create-#{kind}")
    |> UI.fill_text_field(testid: "tool-name", with: name)
    |> UI.click(testid: "save-tool-name")
    |> UI.refute_has(testid: "tool-name-modal")
    |> UI.assert_text(name, testid: "#{kind}-list")
  end

  step :remember_tools, ctx do
    board = Repo.get_by!(Operately.Tasks.TaskBoard, space_id: ctx.space.id, name: "Campaigns")
    hub = Repo.get_by!(Operately.ResourceHubs.ResourceHub, space_id: ctx.space.id, name: "Brand assets")
    Map.merge(ctx, %{board: board, hub: hub})
  end

  step :assert_unsaved_toggle_preserved, ctx do
    ctx = UI.assert_has(ctx, css: "[data-test-id='task-board'][data-state='unchecked']")
    assert Repo.reload!(ctx.space).tools.tasks_enabled
    ctx
  end

  step :open_tool_menu, ctx, key do
    item = Map.fetch!(ctx, key)
    UI.click(ctx, css: "[data-test-id='tool-menu-#{Operately.ShortUuid.encode!(item.id)}']:not([disabled])")
  end

  step :choose_action, ctx, action do
    UI.click(ctx, testid: action)
  end

  step :rename_tool, ctx, name do
    ctx
    |> UI.fill_text_field(testid: "tool-name", with: name)
    |> UI.click(testid: "save-tool-name")
    |> UI.refute_has(testid: "tool-name-modal")
  end

  step :drag_board_first, ctx do
    board_id = Operately.ShortUuid.encode!(ctx.board.id)
    default_id = Operately.ShortUuid.encode!(ctx.space.default_task_board_id)

    UI.execute("drag_board_first", ctx, fn session ->
      session
      |> Wallaby.Browser.hover(Wallaby.Query.css("[data-test-id='drag-tool-#{board_id}']:not([disabled])"))
      |> Wallaby.Browser.button_down()
      |> Wallaby.Browser.move_mouse_by(0, -6)
      |> Wallaby.Browser.hover(Wallaby.Query.css("[data-test-id='tool-instance-#{default_id}']"))
      |> Wallaby.Browser.move_mouse_by(0, -20)
      |> Wallaby.Browser.button_up()
    end)
  end

  step :assert_board_first, ctx do
    id = Operately.ShortUuid.encode!(ctx.board.id)
    UI.assert_has(ctx, css: "[data-test-id='board-list'] > :first-child[data-test-id='tool-instance-#{id}']")
  end

  step :confirm_action, ctx do
    ctx
    |> UI.click(testid: "confirm-tool-action-confirm")
    |> UI.refute_has(testid: "confirm-tool-action")
  end

  step :assert_board_archived, ctx do
    ctx = UI.assert_has(ctx, testid: "archived-boards-section")
    assert Repo.reload!(ctx.board).archived_at
    ctx
  end

  step :expand_archived_boards, ctx do
    UI.click(ctx, css: "[data-test-id='archived-boards-section'] summary")
  end

  step :assert_board_restored, ctx do
    ctx = UI.refute_has(ctx, testid: "archived-boards-section")
    refute Repo.reload!(ctx.board).archived_at
    ctx
  end

  step :assert_board_default, ctx do
    id = Operately.ShortUuid.encode!(ctx.board.id)
    ctx = UI.assert_has(ctx, css: "[data-test-id='tool-instance-#{id}'] [data-test-id='default-tool']")
    assert Repo.reload!(ctx.space).default_task_board_id == ctx.board.id
    ctx
  end

  step :assert_hub_deleted, ctx do
    id = Operately.ShortUuid.encode!(ctx.hub.id)
    ctx = UI.refute_has(ctx, testid: "tool-instance-#{id}")
    refute Repo.get(Operately.ResourceHubs.ResourceHub, ctx.hub.id)
    ctx
  end

  step :save_visibility, ctx do
    ctx |> UI.click(testid: "save") |> UI.assert_has(testid: "space-page")
  end

  step :assert_board_cards_hidden, ctx do
    UI.refute_has(ctx, css: "[data-test-id^='tasks-tool']")
  end

  step :assert_board_cards, ctx, name do
    ctx
    |> UI.assert_text(name, testid: "tasks-tool-#{Operately.ShortUuid.encode!(ctx.board.id)}")
    |> UI.assert_has(Wallaby.Query.css("[data-test-id^='tasks-tool']", count: 2))
  end

  step :assert_hub_card, ctx do
    UI.assert_text(ctx, ctx.hub.name)
  end

  step :capture_configuration, ctx do
    if System.get_env("CAPTURE_TOOL_MANAGEMENT") == "true" do
      ctx =
        if Wallaby.Browser.has?(ctx.session, UI.query(testid: "product-release-toast-dismiss")) do
          UI.click(ctx, testid: "product-release-toast-dismiss")
        else
          ctx
        end

      ctx
      |> Map.update!(:session, &Wallaby.Browser.resize_window(&1, 1280, 1500))
      |> UI.take_screenshot()
      |> Map.update!(:session, &Wallaby.Browser.resize_window(&1, 390, 1800))
      |> UI.take_screenshot()
      |> Map.update!(:session, &Wallaby.Browser.resize_window(&1, 1920, 2000))
    else
      ctx
    end
  end
end
