defmodule Operately.Features.Spaces.ToolManagementTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.Spaces.ToolManagementSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "creating boards and hubs preserves unsaved visibility changes", ctx do
    ctx
    |> Steps.visit_configuration()
    |> Steps.toggle_category("task-board")
    |> Steps.create_tool({"board", "Campaigns"})
    |> Steps.create_tool({"hub", "Brand assets"})
    |> Steps.remember_tools()
    |> Steps.assert_unsaved_toggle_preserved()
    |> Steps.capture_configuration()
    |> Steps.leave_configuration()
    |> Steps.assert_board_cards("Campaigns")
    |> Steps.assert_hub_card()
  end

  feature "renaming a board updates its space card", ctx do
    ctx
    |> Steps.given_another_board()
    |> Steps.visit_configuration()
    |> Steps.open_tool_menu(:board)
    |> Steps.choose_action("rename-tool")
    |> Steps.rename_tool("Campaign planning")
    |> Steps.leave_configuration()
    |> Steps.assert_board_cards("Campaign planning")
  end

  feature "dragging boards saves their order while tasks are hidden", ctx do
    ctx
    |> Steps.given_another_board()
    |> Factory.set_space_tools(:space, tasks_enabled: false)
    |> Steps.visit_space()
    |> Steps.assert_board_cards_hidden()
    |> Steps.visit_configuration()
    |> Steps.drag_board_first()
    |> Steps.assert_board_first()
    |> Steps.leave_configuration()
    |> Steps.assert_board_cards_hidden()
    |> Steps.visit_configuration()
    |> Steps.assert_board_first()
    |> Steps.toggle_category("task-board")
    |> Steps.save_visibility()
    |> Steps.assert_board_cards("Campaigns")
  end

  feature "archiving and restoring a board works while tasks are hidden", ctx do
    ctx
    |> Steps.given_another_board()
    |> Factory.set_space_tools(:space, tasks_enabled: false)
    |> Steps.visit_configuration()
    |> Steps.open_tool_menu(:board)
    |> Steps.choose_action("archive-tool")
    |> Steps.confirm_action()
    |> Steps.assert_board_archived()
    |> Steps.expand_archived_boards()
    |> Steps.open_tool_menu(:board)
    |> Steps.choose_action("restore-tool")
    |> Steps.assert_board_restored()
  end

  feature "selecting a default board works while tasks are hidden", ctx do
    ctx
    |> Steps.given_another_board()
    |> Factory.set_space_tools(:space, tasks_enabled: false)
    |> Steps.visit_configuration()
    |> Steps.open_tool_menu(:board)
    |> Steps.choose_action("set-default-tool")
    |> Steps.assert_board_default()
  end

  feature "deleting an empty hub works while Resource Hubs are hidden", ctx do
    ctx
    |> Factory.add_resource_hub(:hub, :space, :creator, name: "Brand assets")
    |> Factory.set_space_tools(:space, resource_hub_enabled: false)
    |> Steps.visit_configuration()
    |> Steps.open_tool_menu(:hub)
    |> Steps.choose_action("delete-tool")
    |> Steps.confirm_action()
    |> Steps.assert_hub_deleted()
  end
end
