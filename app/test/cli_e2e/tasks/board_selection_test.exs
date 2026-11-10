defmodule Operately.CliE2E.Tasks.BoardSelectionTest do
  use Operately.CliE2ECase
  alias Operately.Support.CliE2E.Tasks.BoardSelectionSteps, as: Steps

  setup ctx, do: {:ok, Steps.setup(ctx)}

  test "discovers boards, selects a board, and moves a task back to the default", ctx do
    ctx
    |> Steps.given_another_board()
    |> Steps.discover_boards()
    |> Steps.create_task_on_selected_board()
    |> Steps.list_selected_board()
    |> Steps.move_task_to_default()
    |> Steps.create_task_on_default_board()
    |> Steps.list_all_space_tasks()
    |> Steps.assert_unavailable_default_details()
  end

  test "creates and renames a board without changing the default", ctx do
    ctx
    |> Steps.create_board()
    |> Steps.rename_board()
    |> Steps.assert_managed_boards_listed()
  end
end
