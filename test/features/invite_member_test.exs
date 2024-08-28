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
      password: "Aa12345#&!123",
    }

    ctx
    |> Steps.log_in_as_admin()
    |> Steps.navigate_to_invitation_page()
    |> Steps.invite_member(params)
    |> Steps.assert_member_invited()
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
end
