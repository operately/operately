defmodule Operately.Features.OutsideCollaboratorAccessTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.OutsideCollaboratorAccessSteps, as: Steps

  describe "project access for outside collaborators" do
    setup ctx do
      Steps.setup_project_with_parent_goal(ctx)
    end

    feature "outside collaborator gets 404 on project page without explicit access", ctx do
      ctx
      |> Steps.assert_only_company_member_has_edit_access_to_project()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_project_page()
      |> Steps.assert_404_page()
    end

    feature "outside collaborator can see project page after being granted explicit access", ctx do
      ctx
      |> Steps.assert_only_company_member_has_edit_access_to_project()
      |> Steps.give_collaborator_project_access()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_project_page()
      |> Steps.assert_project_page_visible()
      |> Steps.assert_parent_goal_not_visible()
      |> Steps.assert_move_space_option_not_visible()
      |> Steps.assert_space_not_in_navigation()
    end

    feature "outside collaborator gets 404 on parent goal page even with project access", ctx do
      ctx
      |> Steps.assert_only_company_member_has_edit_access_to_parent_goal()
      |> Steps.give_collaborator_project_access()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_parent_goal_page()
      |> Steps.assert_404_page()
    end

    feature "outside collaborator gets 404 on space page even with project access", ctx do
      ctx
      |> Steps.assert_only_company_member_has_edit_access_to_space()
      |> Steps.give_collaborator_project_access()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_space_page()
      |> Steps.assert_404_page()
    end
  end

  describe "goal access for outside collaborators" do
    setup ctx do
      Steps.setup_goal_with_parent_goal(ctx)
    end

    feature "outside collaborator gets 404 on goal page without explicit access", ctx do
      ctx
      |> Steps.assert_only_company_member_has_edit_access_to_goal()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_goal_page()
      |> Steps.assert_404_page()
    end

    feature "outside collaborator can see goal page after being granted explicit access", ctx do
      ctx
      |> Steps.assert_only_company_member_has_edit_access_to_goal()
      |> Steps.give_collaborator_goal_access()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_goal_page()
      |> Steps.assert_goal_page_visible()
      |> Steps.assert_parent_goal_not_visible()
      |> Steps.assert_move_space_option_not_visible()
      |> Steps.assert_space_not_in_navigation()
    end

    feature "outside collaborator gets 404 on parent goal page even with goal access", ctx do
      ctx
      |> Steps.assert_only_company_member_has_edit_access_to_parent_goal()
      |> Steps.give_collaborator_goal_access()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_parent_goal_page()
      |> Steps.assert_404_page()
    end

    feature "outside collaborator gets 404 on space page even with goal access", ctx do
      ctx
      |> Steps.assert_only_company_member_has_edit_access_to_space()
      |> Steps.give_collaborator_goal_access()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_space_page()
      |> Steps.assert_404_page()
    end
  end

  describe "space creation for outside collaborators" do
    setup ctx do
      Steps.setup_outside_collaborator(ctx)
    end

    feature "outside collaborator does not see Add Space button on homepage", ctx do
      ctx
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_home_page()
      |> Steps.assert_add_space_button_not_visible()
    end

    feature "outside collaborator gets error when manually submitting space creation form", ctx do
      ctx
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_new_space_page()
      |> Steps.fill_space_form(%{name: "Test Space", mission: "Test Mission"})
      |> Steps.submit_space_form()
      |> Steps.assert_permission_error_message()
    end
  end

  describe "people directory access for outside collaborators" do
    setup ctx do
      Steps.setup_outside_collaborator(ctx)
    end

    feature "outside collaborator does not see people links in the company dropdown", ctx do
      ctx
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_home_page()
      |> Steps.open_company_dropdown()
      |> Steps.assert_people_link_not_visible_in_company_dropdown()
      |> Steps.assert_org_chart_link_not_visible_in_company_dropdown()
    end

    feature "outside collaborator is redirected when manually accessing people page", ctx do
      ctx
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_people_page()
      |> Steps.assert_redirected_to_home_page()
    end

    feature "outside collaborator is redirected when manually accessing org chart page", ctx do
      ctx
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_org_chart_page()
      |> Steps.assert_redirected_to_home_page()
    end
  end

  describe "profile access for outside collaborators" do
    setup ctx, do: Steps.setup_collaborator_with_goals_and_projects(ctx)

    feature "outside collaborator can open their profile page", ctx do
      ctx
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_profile_page()
      |> Steps.assert_profile_page_loaded()
    end

    feature "outside collaborator profile shows no assignments by default", ctx do
      ctx
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_profile_page()
      |> Steps.click_assigned_tab()
      |> Steps.assert_no_assignments_visible()
    end

    feature "outside collaborator profile shows assignments when they are champion", ctx do
      ctx
      |> Steps.setup_collaborator_as_champion_of_goals_and_projects()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_profile_page()
      |> Steps.click_assigned_tab()
      |> Steps.assert_assignments_visible()
    end

    feature "outside collaborator can edit their about me", ctx do
      about_me = "I'm an outside collaborator helping with projects."

      ctx
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_profile_edit_page()
      |> Steps.fill_about_me(text: about_me)
      |> Steps.submit_profile_changes()
      |> Steps.visit_profile_page()
      |> Steps.click_about_tab()
      |> Steps.assert_about_me_visible(text: about_me)
    end

    feature "outside collaborator can toggle assignments email", ctx do
      ctx
      |> Steps.log_in_as_collaborator()
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

  describe "admin page access for outside collaborators" do
    setup ctx, do: Steps.setup_collaborator_with_goals_and_projects(ctx)

    feature "outside collaborator can open admin page but cannot see admin/owner sections", ctx do
      ctx
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_company_admin_page()
      |> Steps.assert_cannot_see_owners_section()
      |> Steps.assert_cannot_see_admin_section()
    end
  end
end
