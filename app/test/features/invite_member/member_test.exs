defmodule Operately.Features.InviteMember.MemberTest do
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
      password: "Aa12345#&!123"
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
      title: "Developer"
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
end
