defmodule Operately.Features.TaskMilestoneDeletionTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.ProjectTasksSteps, as: TaskSteps

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:product_space)
    |> Factory.add_project(:product_project, :product_space)
    |> Factory.add_project_milestone(:milestone1, :product_project)
    |> Factory.add_project_task(:task1, :milestone1)
    |> Factory.log_in_person(:creator)
  end

  @tag login_as: :creator
  feature "task activity feed handles deleted milestone gracefully", ctx do
    # Step 1: Verify task has milestone initially
    ctx
    |> visit_task_page()
    |> assert_task_has_milestone()

    # Step 2: Delete the milestone from the database (simulating admin action or bug)
    ctx = delete_milestone_from_database(ctx)

    # Step 3: Visit task page and verify no 500 error occurs
    ctx
    |> visit_task_page()
    |> assert_page_loads_without_error()
    |> assert_activity_feed_visible()
  end

  defp visit_task_page(ctx) do
    UI.visit(ctx, "/projects/#{ctx.product_project.id}/tasks/#{ctx.task1.id}")
  end

  defp assert_task_has_milestone(ctx) do
    ctx
    |> UI.assert_text("Milestone:")
    |> UI.assert_text(ctx.milestone1.title)
  end

  defp delete_milestone_from_database(ctx) do
    # Simulate milestone deletion by removing it from the database
    # This could happen through admin actions or other bugs
    Operately.Repo.delete!(ctx.milestone1)
    ctx
  end

  defp assert_page_loads_without_error(ctx) do
    # If the page loads without a 500 error, this assertion will pass
    # The presence of any expected text on the page confirms it loaded
    ctx
    |> UI.assert_text("Task") # Task page should have "Task" text somewhere
  end

  defp assert_activity_feed_visible(ctx) do
    # Check that the activity feed section is present and functional
    # This would fail if the JavaScript error occurs
    ctx
    |> UI.assert_text("Activity") # Activity feed section should be visible
  end
end