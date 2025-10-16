defmodule Operately.Features.InviteMemberTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.InviteMemberSteps, as: Steps

  setup ctx do
    ctx |> Steps.given_that_a_company_and_an_admin_exists()
  end

  feature "admin account can invite members", ctx do
    params = %{
      newTokenTestId: "new-token-john-doe",
      fullName: "John Doe",
      email: "john@some-company.com",
      title: "Developer",
      password: "Aa12345#&!123"
    }

    ctx
    |> Steps.log_in_as_admin()
    |> Steps.navigate_to_invitation_page()
    |> Steps.invite_member(params)
    |> Steps.assert_member_invited()
  end

  feature "admin account can add members with existing account", ctx do
    params = %{
      fullName: "John Doe",
      email: "john@some-company.com",
      title: "Developer"
    }

    ctx
    |> Steps.given_that_an_account_exists_in_another_company(params)
    |> Steps.log_in_as_admin()
    |> Steps.navigate_to_invitation_page()
    |> Steps.invite_member(params)
    |> Steps.assert_member_added(params.fullName)
  end

  feature "joining a company and setting a password", ctx do
    ctx
    |> Steps.given_that_I_was_invited_and_have_a_token(%{name: "John Doe", email: "john@john.com"})
    |> Steps.goto_invitation_page()
    |> Steps.submit_password("Aa12345#&!123")
    |> Steps.assert_password_set_for_new_member(%{email: "john@john.com", password: "Aa12345#&!123"})
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
end
