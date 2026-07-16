defmodule Operately.Features.OutsideCollaborator.ProfileTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.OutsideCollaboratorAccessSteps, as: Steps

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
      |> Steps.visit_notification_settings_page()
      |> Steps.assert_assignments_email_enabled()
      |> Steps.assert_person_in_assignments_cron()
      |> Steps.disable_assignments_email()
      |> Steps.assert_person_not_in_assignments_cron()
      |> Steps.visit_notification_settings_page()
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
