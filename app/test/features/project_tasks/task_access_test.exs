defmodule Operately.Features.ProjectTasks.TaskAccessTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.ProjectTasksSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @tag login_as: :reviewer
  feature "task page hides space navigation when space is not accessible", ctx do
    ctx
    |> Steps.given_task_exists()
    |> ProjectSteps.given_company_members_cannot_access_space()
    |> Steps.visit_task_page()
    |> Steps.assert_task_navigation_without_space()
  end
end
