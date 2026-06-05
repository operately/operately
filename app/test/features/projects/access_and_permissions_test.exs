defmodule Operately.Features.Projects.AccessAndPermissionsTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectsCase

  describe "project page preload access" do
    setup ctx do
      ctx = Steps.create_project(ctx, name: "Test Project")
      ctx = Steps.login(ctx)

      {:ok, ctx}
    end

    @tag login_as: :reviewer
    feature "project page hides parent goal when viewer cannot access it", ctx do
      ctx
      |> Steps.given_a_goal_exists(name: "Hidden Goal")
      |> Steps.given_the_goal_is_connected_with_project()
      |> Steps.assert_project_has_parent_goal()
      |> Steps.given_goal_is_not_accessible_to_company_members()
      |> Steps.given_space_member_exists()
      |> Steps.login_as_space_member()
      |> Steps.visit_project_page()
      |> Steps.assert_project_page_loaded()
      |> Steps.assert_parent_goal_field_not_rendered()
    end

    @tag login_as: :reviewer
    feature "project page hides space navigation when space is not accessible", ctx do
      ctx
      |> Steps.given_company_members_cannot_access_space()
      |> Steps.visit_project_page()
      |> Steps.assert_project_navigation_without_space()
      |> Steps.assert_move_to_another_space_is_hidden()
    end
  end

  describe "project page permissions" do
    setup ctx, do: Steps.setup(ctx)

    feature "Person with edit access can see correct actions", ctx do
      ctx
      |> Steps.given_project_with_edit_access_member_logged_in()
      |> Steps.assert_member_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.assert_manage_access_visible()
      |> Steps.assert_start_date_editable()
      |> Steps.assert_description_editable()
      |> Steps.assert_pause_and_close_actions_visible()
      |> Steps.assert_add_milestone_visible()
      |> Steps.assert_add_resource_visible()
      |> Steps.assert_add_task_and_milestone_visible_in_tasks_tab()
      |> Steps.assert_add_task_visible_in_kanban_view()
      |> Steps.assert_add_check_in_visible()
      |> Steps.assert_add_dicussion_visible()
    end

    feature "Person with comment access can see correct actions", ctx do
      ctx
      |> Steps.given_project_with_comment_access_member_logged_in()
      |> Steps.assert_member_has_comment_access()
      |> Steps.visit_project_page()
      |> Steps.refute_description_editable()
      |> Steps.refute_pause_and_close_actions_visible()
      |> Steps.refute_manage_access_visible()
      |> Steps.refute_add_milestone_visible()
      |> Steps.refute_add_resource_visible()
      |> Steps.refute_add_task_and_milestone_visible_in_tasks_tab()
      |> Steps.refute_add_task_visible_in_kanban_view()
      |> Steps.refute_add_check_in_visible()
      |> Steps.refute_add_dicussion_visible()
    end
  end
end
