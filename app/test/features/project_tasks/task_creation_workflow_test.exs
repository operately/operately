defmodule Operately.Features.ProjectTasks.TaskCreationWorkflowTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectTasksCase

  @tag login_as: :contributor
  feature "creating task automatically subscribes creator", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_milestone_page()
    |> Steps.add_task_from_milestone_page("Task 1")
    |> Steps.assert_task_added("Task 1")
    |> then(fn ctx ->
      task = Operately.Tasks.Task.get!(:system, name: "Task 1")
      Map.put(ctx, :task, task)
    end)
    |> Steps.go_to_task_page()
    |> Steps.assert_subscribed_to_task()
  end

  @tag login_as: :contributor
  feature "creating task with assignee automatically subscribes assignee", ctx do
    ctx = Steps.given_space_member_exists(ctx)

    attrs = %{
      name: "Task with assignee",
      assignee: ctx.space_member.full_name,
      due_date: nil,
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> then(fn ctx ->
      task = Operately.Tasks.Task.get!(:system, name: attrs.name)
      Map.put(ctx, :task, task)
    end)
    |> Steps.login_as_space_member()
    |> Steps.go_to_task_page()
    |> Steps.assert_subscribed_to_task()
  end

  @tag login_as: :contributor
  feature "assigning a space member to a task adds them as a project contributor", ctx do
    ctx = Steps.given_space_member_exists(ctx)

    attrs = %{
      name: "Task for space member",
      assignee: ctx.space_member.full_name,
      due_date: nil,
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.assert_person_is_not_project_contributor()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.go_to_task_page()
    |> Steps.assert_assignee(attrs.assignee)
    |> Steps.visit_project_page()
    |> Steps.assert_person_is_project_contributor()
  end

  @tag login_as: :contributor
  feature "add multiple tasks with 'Create more' toggle on", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_multiple_tasks(names: ["1st task", "2nd task"])
    |> Steps.assert_task_added("1st task")
    |> Steps.assert_task_added("2nd task")
  end

  @tag login_as: :contributor
  feature "all form fields are cleared after task is added", ctx do
    attrs = %{
      name: "Task 1",
      assignee: ctx.champion.full_name,
      due_date: Operately.Support.Time.next_friday(),
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.open_task_form_and_fill_out_all_fields(attrs)
    |> Steps.toggle_create_more_switch()
    |> Steps.click_create_task_button()
    |> Steps.assert_form_fields_are_empty()
  end
end
