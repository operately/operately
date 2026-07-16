defmodule Operately.Features.InviteMember.GuestAccountsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.InviteMemberSteps, as: Steps

  set_app_config(:allow_login_with_email, true)
  set_app_config(:allow_login_with_google, true)

  setup ctx do
    ctx |> Steps.given_that_a_company_and_an_admin_exists()
  end

  describe "with guest accounts feature enabled" do
    feature "admin account can invite team members", ctx do
      full_name = "Jamie Cole"

      params = %{
        fullName: full_name,
        email: Operately.PeopleFixtures.unique_account_email(full_name),
        title: "Engineer"
      }

      ctx
      |> Steps.log_in_as_admin()
      |> Steps.navigate_to_member_type_selection_page()
      |> Steps.select_team_member_type()
      |> Steps.open_single_member_invite_form()
      |> Steps.invite_member(params)
      |> Steps.assert_member_invited()
    end

    feature "admin account can invite outside collaborators", ctx do
      full_name = "Morgan Patel"

      params = %{
        fullName: full_name,
        email: Operately.PeopleFixtures.unique_account_email(full_name),
        title: "Consultant"
      }

      ctx
      |> Steps.log_in_as_admin()
      |> Steps.navigate_to_member_type_selection_page()
      |> Steps.select_outside_collaborator_type()
      |> Steps.invite_collaborator(params)
      |> Steps.assert_member_invited()
      |> Steps.assert_guest_invited_email_sent(params[:email])
    end

    feature "invite outside collaborator and don't give access to resources", ctx do
      params = %{
        fullName: "Morgan Patel",
        email: Operately.PeopleFixtures.unique_account_email("Morgan Patel"),
        title: "Consultant"
      }

      ctx
      |> Steps.given_multiple_spaces_goals_and_projects_exist()
      |> Steps.log_in_as_admin()
      |> Steps.navigate_to_member_type_selection_page()
      |> Steps.select_outside_collaborator_type()
      |> Steps.invite_collaborator(params)
      |> Steps.assert_member_invited()
      |> Steps.log_in_as_outside_collaborator(params.email)
      |> Steps.assert_all_spaces_hidden()
      |> Steps.assert_empty_feed()
      |> Steps.assert_work_map_shows_no_resources()
    end

    feature "invite outside collaborator and give access to resources", ctx do
      params = %{
        fullName: "Morgan Patel",
        email: Operately.PeopleFixtures.unique_account_email("Morgan Patel"),
        title: "Consultant"
      }

      ctx
      |> Steps.given_multiple_spaces_goals_and_projects_exist()
      |> Steps.log_in_as_admin()
      |> Steps.navigate_to_member_type_selection_page()
      |> Steps.select_outside_collaborator_type()
      |> Steps.invite_collaborator(params)
      |> Steps.give_collaborator_access_to_space()
      |> Steps.give_collaborator_access_to_project()
      |> Steps.give_collaborator_access_to_goal()
      |> Steps.confirm_access_to_resources()
      |> Steps.log_in_as_outside_collaborator(params.email)
      |> Steps.assert_access_to_correct_spaces()
      |> Steps.assert_items_in_feed()
      |> Steps.assert_work_map_shows_correct_resources()
    end

    feature "outside collaborator can accept invitation", ctx do
      full_name = "Alex Parker"
      password = "Aa12345#&!123"

      params = %{
        fullName: full_name,
        email: Operately.PeopleFixtures.unique_account_email(full_name),
        title: "Advisor",
        password: password
      }

      ctx
      |> Steps.given_that_an_outside_collaborator_was_invited(params)
      |> Steps.goto_invitation_page()
      |> Steps.submit_password(password)
      |> Steps.assert_password_set_for_new_member(%{email: params.email, password: password})
      |> Steps.assert_guest_invited_notification()
    end

    feature "team member can accept invitation and see activity", ctx do
      full_name = "Casey Morgan"
      password = "Aa12345#&!123"

      params = %{
        fullName: full_name,
        email: Operately.PeopleFixtures.unique_account_email(full_name),
        title: "Product Manager",
        password: password
      }

      ctx
      |> Steps.given_that_a_company_member_was_invited(params)
      |> Steps.goto_invitation_page()
      |> Steps.submit_password(password)
      |> Steps.assert_password_set_for_new_member(%{email: params.email, password: password})
      |> Steps.assert_company_member_added_feed_item()
      |> Steps.assert_company_member_added_notification()
    end

    feature "admin account can invite team members and email is sent", ctx do
      full_name = "Jordan Smith"

      params = %{
        fullName: full_name,
        email: Operately.PeopleFixtures.unique_account_email(full_name),
        title: "Designer"
      }

      ctx
      |> Steps.log_in_as_admin()
      |> Steps.navigate_to_member_type_selection_page()
      |> Steps.select_team_member_type()
      |> Steps.open_single_member_invite_form()
      |> Steps.invite_member(params)
      |> Steps.assert_member_invited()
      |> Steps.assert_member_invited_email_sent(params[:email])
    end
  end
end
