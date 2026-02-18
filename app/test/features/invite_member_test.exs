defmodule Operately.Features.InviteMemberTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.InviteMemberSteps, as: Steps

  set_app_config(:allow_login_with_email, true)
  set_app_config(:allow_login_with_google, true)

  setup ctx do
    ctx |> Steps.given_that_a_company_and_an_admin_exists()
  end

  feature "admin account can invite members", ctx do
    params = %{
      newTokenTestId: "new-token-john-doe",
      fullName: "John Doe",
      email: "john@some-company.com",
      title: "Developer",
      password: "Aa12345#&!123",
    }

    ctx
    |> Steps.log_in_as_admin()
    |> Steps.navigate_to_invitation_page()
    |> Steps.invite_member(params)
    |> Steps.assert_member_invited()
    |> Steps.assert_member_invited_email_sent(params.email)
  end

  feature "admin account can add members with existing account", ctx do
    params = %{
      fullName: "John Doe",
      email: "john@some-company.com",
      title: "Developer",
    }

    ctx
    |> Steps.given_that_an_account_exists_in_another_company(params)
    |> Steps.log_in_as_admin()
    |> Steps.navigate_to_invitation_page()
    |> Steps.invite_member(params)
    |> Steps.assert_member_added(params.fullName)
    |> Steps.assert_member_added_email_sent(params.email)
  end

  feature "joining a company and setting a password", ctx do
    ctx
    |> Steps.given_that_I_was_invited_and_have_a_token(%{name: "John Doe", email: "john@john.com"})
    |> Steps.goto_invitation_page()
    |> Steps.submit_password("Aa12345#&!123")
    |> Steps.assert_password_set_for_new_member(%{email: "john@john.com", password: "Aa12345#&!123"})
  end

  feature "joining a company via Google using an invitation", ctx do
    ctx
    |> Steps.given_that_I_was_invited_and_have_a_token(%{name: "John Doe", email: "john@john.com"})
    |> Steps.goto_invitation_page()
    |> Steps.join_company_with_google()
    |> Steps.assert_joined_company_via_google()
  end

  feature "admin can reissue tokens", ctx do
    ctx
    |> Steps.log_in_as_admin()
    |> Steps.given_that_an_invitation_was_sent(%{name: "John Doe", email: "john@john.com"})
    |> Steps.reissue_invitation_token("John Doe")
    |> Steps.assert_member_invited()
  end

  feature "admin can see and renew expired invitations", ctx do
    ctx
    |> Steps.log_in_as_admin()
    |> Steps.given_that_an_invitation_was_sent_and_expired(%{name: "John Doe", email: "john@john.com"})
    |> Steps.assert_an_expired_warning_is_shown_on_the_team_page()
    |> Steps.renew_invitation("John Doe")
    |> Steps.assert_invitation_renewed()
  end

  feature "admin can view invite link after reloading team page", ctx do
    ctx
    |> Steps.log_in_as_admin()
    |> Steps.given_that_an_invitation_was_sent(%{name: "John Doe", email: "john@john.com"})
    |> Steps.open_company_team_page()
    |> Steps.open_invitation_link_view_for("John Doe")
    |> Steps.assert_invitation_link_modal_visible("John Doe")
  end

  describe "invitation expiration times" do
    setup ctx do
      Steps.log_in_as_admin(ctx)
    end

    test "viewing invitation expiration in minutes", ctx do
      ctx
      |> Steps.given_that_an_invitation_will_expire_in_minutes(%{name: "Minutes User", email: "minutes@example.com"})
      |> Steps.open_company_team_page()
      |> Steps.assert_invitation_expires_in_minutes()
    end

    test "viewing invitation expiration in hours", ctx do
      ctx
      |> Steps.given_that_an_invitation_will_expire_in_hours(%{name: "Hours User", email: "hours@example.com"})
      |> Steps.open_company_team_page()
      |> Steps.assert_invitation_expires_in_hours()
    end

    test "viewing invitation expiration in days", ctx do
      ctx
      |> Steps.given_that_an_invitation_will_expire_in_days(%{name: "Days User", email: "days@example.com"})
      |> Steps.open_company_team_page()
      |> Steps.assert_invitation_expires_in_days()
    end
  end

  describe "with guest accounts feature enabled" do
    feature "admin account can invite team members", ctx do
      full_name = "Jamie Cole"

      params = %{
        fullName: full_name,
        email: Operately.PeopleFixtures.unique_account_email(full_name),
        title: "Engineer",
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
        title: "Consultant",
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
        title: "Consultant",
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
        title: "Consultant",
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
        password: password,
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
        password: password,
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
        title: "Designer",
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
