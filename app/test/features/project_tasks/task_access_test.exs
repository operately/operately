defmodule Operately.Features.ProjectTasks.TaskAccessTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectTasksCase

  @tag login_as: :reviewer
  feature "task page hides space navigation when space is not accessible", ctx do
    ctx
    |> Steps.given_task_exists()
    |> ProjectSteps.given_company_members_cannot_access_space()
    |> Steps.visit_task_page()
    |> Steps.assert_task_navigation_without_space()
  end
end
