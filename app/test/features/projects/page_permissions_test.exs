defmodule Operately.Features.Projects.PagePermissionsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps, as: Steps

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
      |> Steps.refute_add_task_and_milestone_visible_in_tasks_tab()
      |> Steps.refute_add_task_visible_in_kanban_view()
      |> Steps.refute_add_check_in_visible()
      |> Steps.refute_add_dicussion_visible()
    end
  end
end
