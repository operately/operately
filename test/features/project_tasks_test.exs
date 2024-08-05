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

    ctx
    |> Steps.visit_milestone_page()
    |> Steps.add_task(attrs1)
    |> Steps.assert_task_added(attrs1)
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

  @tag login_as: :champion
  feature "edit task name and description", ctx do
    attrs = %{
      title: "My task",
      description: "Some description",
      test_id: "todo_0",
    }
    name = "new name"
    description = " - new description"

    ctx
    |> Steps.visit_milestone_page()
    |> Steps.add_task(attrs)
    |> Steps.assert_task_added(attrs)
    |> Steps.click_on_task(attrs)
    |> UI.refute_text(name)
    |> Steps.edit_task_name(name)
    |> UI.assert_text(name)
    |> UI.refute_text(description)
    |> Steps.edit_task_description(description)
    |> UI.assert_text(attrs.description <> description)
  end

  @tag login_as: :champion
  feature "edit task assignees", ctx do
    attrs = %{
      title: "My task",
      description: "Some description",
      test_id: "todo_0",
    }
    assignees = [ ctx.champion.full_name, ctx.reviewer.full_name ]

    ctx
    |> Steps.visit_milestone_page()
    |> Steps.add_task(attrs)
    |> Steps.assert_task_added(attrs)
    |> Steps.click_on_task(attrs)
    |> Steps.assert_no_assignee()
    |> Steps.edit_task_assignees(assignees)
    |> Steps.assert_assignees(assignees)
  end

  @tag login_as: :champion
  feature "remove task assignees", ctx do
    assignees = [ ctx.champion.full_name, ctx.reviewer.full_name ]
    attrs = %{
      title: "My task",
      description: "Some description",
      assignees: assignees,
      test_id: "todo_0",
    }

    ctx
    |> Steps.visit_milestone_page()
    |> Steps.add_task(attrs)
    |> Steps.assert_task_added(attrs)
    |> Steps.click_on_task(attrs)
    |> Steps.assert_assignees(assignees)
    |> Steps.remove_assignee(ctx.champion.full_name)
    |> Steps.assert_assignees([ctx.reviewer.full_name])
    |> Steps.assert_no_specific_assignee(ctx.champion.full_name)
    |> Steps.remove_assignee(ctx.reviewer.full_name)
    |> Steps.assert_no_assignee()
  end
end
