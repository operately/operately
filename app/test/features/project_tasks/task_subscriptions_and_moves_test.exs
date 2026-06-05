defmodule Operately.Features.ProjectTasks.TaskSubscriptionsAndMovesTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectTasksCase

  @tag login_as: ""
  feature "user can subscribe to task", ctx do
    ctx
    |> Steps.given_task_and_company_member_exist()
    |> Steps.visit_task_page()
    |> Steps.assert_unsubscribed_from_task()
    |> Steps.subscribe_to_task()
    |> Steps.assert_subscribed_to_task()
    |> Steps.visit_project_page()
    |> Steps.visit_task_page()
    |> Steps.assert_subscribed_to_task()
  end

  @tag login_as: ""
  feature "user can unsubscribe to task", ctx do
    ctx
    |> Steps.given_task_and_assignee_exist()
    |> Steps.visit_task_page()
    |> Steps.assert_subscribed_to_task()
    |> Steps.unsubscribe_from_task()
    |> Steps.assert_unsubscribed_from_task()
    |> Steps.visit_project_page()
    |> Steps.visit_task_page()
    |> Steps.assert_unsubscribed_from_task()
  end

  describe "move task" do
    @tag login_as: :contributor
    feature "move to a space from sidebar actions", ctx do
      ctx
      |> Steps.assert_contributor_has_edit_access()
      |> Steps.given_task_exists(name: "Implement user authentication")
      |> Steps.given_destination_space_exists()
      |> Steps.visit_project_page()
      |> Steps.go_to_tasks_tab()
      |> Steps.assert_task_present()
      |> Steps.visit_task_page()
      |> Steps.move_task_to_destination_space()
      |> Steps.assert_redirected_to_destination_space_kanban()
      |> Steps.assert_task_present()
      |> Steps.visit_project_page()
      |> Steps.go_to_tasks_tab()
      |> Steps.assert_task_not_present()
    end

    @tag login_as: :contributor
    feature "move to another project from sidebar actions", ctx do
      ctx
      |> Steps.assert_contributor_has_edit_access()
      |> Steps.given_task_exists(name: "Implement user authentication")
      |> Steps.given_destination_project_exists()
      |> Steps.visit_project_page()
      |> Steps.go_to_tasks_tab()
      |> Steps.assert_task_present()
      |> Steps.visit_task_page()
      |> Steps.move_task_to_destination_project()
      |> Steps.assert_redirected_to_destination_project_task()
      |> Steps.assert_task_belongs_to_destination_project()
      |> Steps.visit_project_page()
      |> Steps.go_to_tasks_tab()
      |> Steps.assert_task_not_present()
      |> Steps.visit_destination_project_page()
      |> Steps.go_to_tasks_tab()
      |> Steps.assert_task_present()
    end

    @tag login_as: :contributor
    feature "current project not shown as option", ctx do
      ctx
      |> Steps.assert_contributor_has_edit_access()
      |> Steps.given_task_exists(name: "Implement user authentication")
      |> Steps.given_destination_project_exists()
      |> Steps.visit_task_page()
      |> Steps.open_move_task_modal()
      |> Steps.assert_only_destination_project_shown()
    end
  end
end
