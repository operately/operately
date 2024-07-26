defmodule Operately.Features.ProjectTasksTest do
  use Operately.FeatureCase

  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.ProjectTaskSteps, as: Steps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    milestone = milestone_fixture(ctx.champion, %{project_id: ctx.project.id, title: "The Milestone"})

    {:ok, Map.merge(ctx, %{milestone: milestone})}
  end

  @tag login_as: :champion
  feature "create task", ctx do
    attrs1 = %{
      title: "Task 1",
      description: "Some description",
      assignees: [ctx.champion.full_name],
      test_id: "todo_0",
    }
    attrs2 = Map.merge(attrs1, %{
      title: "Task 2",
      test_id: "todo_1",
    })

    ctx
    |> Steps.visit_milestone_page()
    |> Steps.add_task(attrs1)
    |> Steps.assert_task_added(attrs1)
    |> Steps.add_task(attrs2)
    |> Steps.assert_task_added(attrs2)
  end

  @tag login_as: :champion
  feature "create task without assignee", ctx do
    attrs = %{
      title: "My task",
      description: "Some description",
      test_id: "todo_0",
    }

    ctx
    |> Steps.visit_milestone_page()
    |> Steps.add_task(attrs)
    |> Steps.assert_task_added(attrs)
  end

  @tag login_as: :champion
  feature "create task with several assignees", ctx do
    person = person_fixture_with_account(%{company_id: ctx.company.id})
    attrs = %{
      title: "My task",
      description: "Some description",
      assignees: [
        ctx.champion.full_name,
        ctx.reviewer.full_name,
        person.full_name,
      ],
      test_id: "todo_0",
    }

    ctx
    |> Steps.visit_milestone_page()
    |> Steps.add_task(attrs)
    |> Steps.assert_task_added(attrs)
  end
end
