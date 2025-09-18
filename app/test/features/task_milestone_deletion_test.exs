defmodule Operately.Features.TaskMilestoneDeletionTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps

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
  feature "task page loads when milestone is deleted from database", ctx do
    # Step 1: Ensure task exists with milestone
    task = ctx.task1
    assert task.milestone_id == ctx.milestone1.id

    # Step 2: Simulate milestone deletion (could happen through admin actions, cascading deletes, etc.)
    Operately.Repo.delete!(ctx.milestone1)

    # Step 3: Visit task page - this would previously cause a 500 error
    # The page should load normally without crashing, even though the milestone reference is broken
    ctx
    |> UI.visit("/projects/#{ctx.product_project.id}/tasks/#{ctx.task1.id}")
    |> UI.assert_page("/projects/#{ctx.product_project.id}/tasks/#{ctx.task1.id}")
    |> UI.assert_text(ctx.task1.name) # Basic verification that page loaded
  end

  @tag login_as: :creator
  feature "project page activity feed handles deleted milestone gracefully", ctx do
    # Step 1: Create activity by updating task milestone  
    ctx = Factory.add_project_milestone(ctx, :milestone2, :product_project)
    
    # Update the task to create an activity record
    {:ok, _} = Operately.Operations.TaskUpdate.run(ctx.creator, ctx.task1, %{
      milestone_id: ctx.milestone2.id
    })

    # Step 2: Delete the milestone to break the reference
    Operately.Repo.delete!(ctx.milestone2)

    # Step 3: Visit project page which shows activity feed
    # This should not crash even though the activity references a deleted milestone
    ctx
    |> UI.visit("/projects/#{ctx.product_project.id}")
    |> UI.assert_page("/projects/#{ctx.product_project.id}")
    |> UI.assert_text("Activity") # Verify activity feed section loads
  end
end