defmodule Operately.Features.InviteMember.ExpirationTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.InviteMemberSteps, as: Steps

  set_app_config(:allow_login_with_email, true)
  set_app_config(:allow_login_with_google, true)

  setup ctx do
    ctx |> Steps.given_that_a_company_and_an_admin_exists()
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

    feature "viewing invitation expiration in minutes", ctx do
      ctx
      |> Steps.given_that_an_invitation_will_expire_in_minutes(%{name: "Minutes User", email: "minutes@example.com"})
      |> Steps.open_company_team_page()
      |> Steps.assert_invitation_expires_in_minutes()
    end

    feature "viewing invitation expiration in hours", ctx do
      ctx
      |> Steps.given_that_an_invitation_will_expire_in_hours(%{name: "Hours User", email: "hours@example.com"})
      |> Steps.open_company_team_page()
      |> Steps.assert_invitation_expires_in_hours()
    end

    feature "viewing invitation expiration in days", ctx do
      ctx
      |> Steps.given_that_an_invitation_will_expire_in_days(%{name: "Days User", email: "days@example.com"})
      |> Steps.open_company_team_page()
      |> Steps.assert_invitation_expires_in_days()
    end
  end
end
