defmodule Operately.Features.ProfileTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProfileSteps, as: Steps

  setup ctx do
    ctx = Steps.given_a_person_exists_with_manager_reports_and_peers(ctx)
    Operately.Support.Features.UI.login_as(ctx, ctx.person)
  end

  feature "view how to contact the person", ctx do
    ctx
    |> Steps.visit_profile_page()
    |> Steps.click_about_tab()
    |> Steps.assert_contact_email_visible()
  end

  feature "view colleagues", ctx do
    ctx
    |> Steps.visit_profile_page()
    |> Steps.click_about_tab()
    |> Steps.assert_manager_visible()
    |> Steps.assert_reports_visible()
    |> Steps.assert_peers_visible()
  end

  feature "view manager's profile", ctx do
    ctx
    |> Steps.visit_profile_page()
    |> Steps.click_about_tab()
    |> Steps.click_manager()
    |> Steps.assert_on_manager_profile()
    |> Steps.assert_person_listed_as_report_on_manager_profile()
  end

  feature "view assigned goals and projects", ctx do
    ctx
    |> Steps.given_goals_exist_for_person()
    |> Steps.given_projects_exist_for_person()
    |> Steps.visit_profile_page()
    |> Steps.click_assigned_tab()
    |> Steps.assert_assinged_goals_and_projects_visible()
    |> Steps.refute_reviewing_goals_and_projects_visible()
  end

  feature "view reviewing goals and projects", ctx do
    ctx
    |> Steps.given_goals_exist_for_person()
    |> Steps.given_projects_exist_for_person()
    |> Steps.visit_profile_page()
    |> Steps.click_reviewing_tab()
    |> Steps.assert_reviewing_goals_and_projects_visible()
    |> Steps.refute_assinged_goals_and_projects_visible()
  end

  feature "view completed goals and projects", ctx do
    ctx
    |> Steps.given_goals_exist_for_person()
    |> Steps.given_projects_exist_for_person()
    |> Steps.given_a_goal_is_closed()
    |> Steps.given_a_project_is_closed()
    |> Steps.visit_profile_page()
    |> Steps.click_completed_tab()
    |> Steps.assert_only_completed_goals_and_projects_visible()
  end

  feature "view paused projects", ctx do
    ctx
    |> Steps.given_goals_exist_for_person()
    |> Steps.given_projects_exist_for_person()
    |> Steps.given_a_project_is_paused()
    |> Steps.visit_profile_page()
    |> Steps.click_paused_tab()
    |> Steps.assert_only_paused_project_visible()
  end

  feature "paused items appear when user is the reviewer", ctx do
    ctx = Steps.given_project_with_user_as_reviewer_exists(ctx)

    ctx
    |> Steps.visit_profile_page()
    |> Steps.click_assigned_tab()
    |> Steps.refute_item_visible(name: ctx.project.name)
    |> Steps.click_reviewing_tab()
    |> Steps.assert_item_visible(name: ctx.project.name)

    ctx
    |> Steps.given_a_project_is_paused(project_key: :project)
    |> Steps.visit_profile_page()
    |> Steps.click_reviewing_tab()
    |> Steps.refute_item_visible(name: ctx.project.name)
    |> Steps.click_paused_tab()
    |> Steps.assert_item_visible(name: ctx.project.name)
  end

  feature "completed items appear when user is the reviewer", ctx do
    ctx = Steps.given_project_with_user_as_reviewer_exists(ctx)
    ctx = Steps.given_goal_with_user_as_reviewer_exists(ctx)

    ctx
    |> Steps.visit_profile_page()
    |> Steps.click_assigned_tab()
    |> Steps.refute_item_visible(name: ctx.project.name)
    |> Steps.refute_item_visible(name: ctx.goal.name)
    |> Steps.click_reviewing_tab()
    |> Steps.assert_item_visible(name: ctx.project.name)
    |> Steps.assert_item_visible(name: ctx.goal.name)

    ctx
    |> Steps.given_a_project_is_closed(project_key: :project)
    |> Steps.given_a_goal_is_closed(goal_key: :goal)
    |> Steps.visit_profile_page()
    |> Steps.click_reviewing_tab()
    |> Steps.refute_item_visible(name: ctx.project.name)
    |> Steps.refute_item_visible(name: ctx.goal.name)
    |> Steps.click_completed_tab()
    |> Steps.assert_item_visible(name: ctx.project.name)
    |> Steps.assert_item_visible(name: ctx.goal.name)
  end

   feature "view tasks assigned to the person", ctx do
    task_name = "Prepare launch checklist"

    ctx
    |> Steps.given_task_assigned_to_person(task_name: task_name)
    |> Steps.visit_profile_page()
    |> Steps.click_tasks_tab()
    |> Steps.assert_item_visible(name: task_name)
  end

  feature "tasks from closed projects are hidden", ctx do
    active_task_name = "Active project task"
    closed_task_name = "Closed project task"

    ctx
    |> Steps.given_task_assigned_to_person(task_key: :active_task, project_key: :active_project, task_name: active_task_name, project_name: "Active Project")
    |> Steps.given_task_assigned_to_person(task_key: :closed_task, project_key: :closed_project, task_name: closed_task_name, project_name: "Closed Project")
    |> Steps.given_task_project_is_closed(project_key: :closed_project)
    |> Steps.visit_profile_page()
    |> Steps.click_tasks_tab()
    |> Steps.assert_item_visible(name: active_task_name)
    |> Steps.refute_item_visible(name: closed_task_name)
  end

  feature "tasks from paused projects are hidden", ctx do
    active_task_name = "In-flight task"
    paused_task_name = "Paused project task"

    ctx
    |> Steps.given_task_assigned_to_person(task_key: :active_task, project_key: :active_project, task_name: active_task_name, project_name: "Active Project")
    |> Steps.given_task_assigned_to_person(task_key: :paused_task, project_key: :paused_project, task_name: paused_task_name, project_name: "Paused Project")
    |> Steps.given_task_project_is_paused(project_key: :paused_project)
    |> Steps.visit_profile_page()
    |> Steps.click_tasks_tab()
    |> Steps.assert_item_visible(name: active_task_name)
    |> Steps.refute_item_visible(name: paused_task_name)
  end

  feature "tasks with closed statuses are hidden", ctx do
    open_task_name = "Task still open"
    closed_status_task_name = "Completed task"

    ctx
    |> Steps.given_task_assigned_to_person(task_key: :open_task, project_key: :open_project, task_name: open_task_name, project_name: "Open Project")
    |> Steps.given_task_assigned_to_person(task_key: :closed_status_task, project_key: :closed_status_project, task_name: closed_status_task_name, project_name: "Closed Status Project")
    |> Steps.given_task_has_closed_status(task_key: :closed_status_task, project_key: :closed_status_project)
    |> Steps.visit_profile_page()
    |> Steps.click_tasks_tab()
    |> Steps.assert_item_visible(name: open_task_name)
    |> Steps.refute_item_visible(name: closed_status_task_name)
  end

  feature "clicking on a project task redirects to the task page", ctx do
    task_name = "Project Task"

    ctx
    |> Steps.given_task_assigned_to_person(task_name: task_name)
    |> Steps.visit_profile_page()
    |> Steps.click_tasks_tab()
    |> Steps.click_task(task_name: task_name)
    |> Steps.assert_on_task_page()
  end

  feature "clicking on a space task redirects to the space kanban page with the task open", ctx do
    task_name = "Space Task"

    ctx
    |> Steps.given_space_task_assigned_to_person(task_name: task_name)
    |> Steps.visit_profile_page()
    |> Steps.click_tasks_tab()
    |> Steps.click_task(task_name: task_name)
    |> Steps.assert_on_space_kanban_page()
    |> Steps.assert_task_slide_in_open(task_name: task_name)
  end

  feature "assignments email toggle controls cron emails", ctx do
    ctx
    |> Steps.visit_profile_edit_page()
    |> Steps.assert_assignments_email_enabled()
    |> Steps.assert_person_in_assignments_cron()
    |> Steps.disable_assignments_email()
    |> Steps.assert_person_not_in_assignments_cron()
    |> Steps.visit_profile_edit_page()
    |> Steps.enable_assignments_email()
    |> Steps.assert_person_in_assignments_cron()
  end
end
