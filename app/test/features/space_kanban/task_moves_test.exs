defmodule Operately.Features.SpaceKanban.TaskMovesTest do
  use Operately.FeatureCase
  @moduletag login_as: :creator

  alias Operately.Support.Features.SpaceKanbanSteps, as: Steps

  setup ctx, do: ctx |> Steps.setup() |> Factory.enable_space_tool(:space, :tasks)

  describe "move task" do
    feature "move to a project from the slide-in sidebar", ctx do
      source_status = hd(ctx.status_values)

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.assert_task_in_status(task_key: :task, status_value: source_status)
      |> Steps.open_task_slide_in(:task)
      |> Steps.move_task_to_project(project_name: ctx.destination_project.name)
      |> Steps.assert_redirected_to_destination_project_task(:task)
      |> Steps.visit_kanban_page()
      |> Steps.assert_task_removed(task_key: :task, status_value: source_status)
      |> Steps.visit_destination_project()
      |> Steps.assert_task_present(task_key: :task)
      |> Steps.assert_task_belongs_to_destination_project(task_key: :task, destination_project_key: :destination_project)
    end

    feature "move to another space from the slide-in sidebar", ctx do
      source_status = hd(ctx.status_values)

      ctx
      |> Steps.visit_kanban_page()
      |> Steps.assert_task_in_status(task_key: :task, status_value: source_status)
      |> Steps.open_task_slide_in(:task)
      |> Steps.move_task_to_space(space_name: ctx.destination_space.name)
      |> Steps.assert_redirected_to_destination_space_task(:task)
      |> Steps.visit_kanban_page()
      |> Steps.assert_task_removed(task_key: :task, status_value: source_status)
      |> Steps.visit_destination_space_kanban_page()
      |> Steps.assert_task_in_status(task_key: :task, status_value: source_status)
      |> Steps.assert_task_belongs_to_destination_space(task_key: :task, destination_space_key: :destination_space)
    end

    feature "move between boards in the same space with a destination status", ctx do
      ctx
      |> Steps.add_second_board()
      |> Steps.visit_kanban_page()
      |> Steps.open_task_slide_in(:task)
      |> Steps.open_move_task_modal()
      |> Steps.select_move_space(:space)
      |> Steps.select_move_board(:board)
      |> Steps.submit_move()
      |> Steps.assert_move_requires_status(:task)
      |> Steps.select_move_status(:board)
      |> Steps.submit_move()
      |> Steps.assert_redirected_to_second_board_task(:task)
      |> Steps.assert_task_on_second_board(:task)
    end

    feature "archived boards cannot be selected as move destinations", ctx do
      ctx
      |> Steps.add_second_board()
      |> Steps.archive_second_board()
      |> Steps.visit_kanban_page()
      |> Steps.open_task_slide_in(:task)
      |> Steps.open_move_task_modal()
      |> Steps.select_move_space(:space)
      |> Steps.assert_no_available_move_boards()
    end
  end
end
