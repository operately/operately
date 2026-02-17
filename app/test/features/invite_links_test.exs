defmodule Operately.Features.InviteLinksTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.InviteLinksSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "managing invite links" do
    setup ctx do
      UI.login_as(ctx, ctx.creator)
    end

    feature "copy invite link from the invite page", ctx do
      ctx
      |> Steps.open_invite_team_page()
      |> Steps.assert_invite_link_visible()
    end

    feature "disable the invite link", ctx do
      ctx
      |> Steps.open_invite_team_page()
      |> Steps.assert_invite_link_is_active()
      |> Steps.disable_invite_link()
      |> Steps.assert_invite_link_is_not_active()
    end

    feature "generating a new invite link", ctx do
      ctx
      |> Steps.open_invite_team_page()
      |> Steps.assert_invite_link_is_active()
      |> Steps.capture_current_invite_token()
      |> Steps.assert_invite_link_on_page()
      |> Steps.reset_invite_link()
      |> Steps.assert_invite_link_token_changed()
      |> Steps.assert_invite_link_on_page()
    end

    feature "limiting which email domains can use the invite link", ctx do
      ctx
      |> Steps.open_invite_team_page()
      |> Steps.enable_domain_restrictions()
      |> Steps.set_allowed_domains("operately.com, example.org")
      |> Steps.assert_allowed_domains(["operately.com", "example.org"])
    end
  end

  describe "logged in user" do
    setup ctx do
      ctx
      |> Steps.given_the_invited_member_has_an_account()
      |> Steps.given_the_invited_member_is_logged_in()
      |> Steps.given_that_an_invite_link_exists()
    end

    feature "joining the company via invite link", ctx do
      ctx
      |> Steps.follow_invite_link()
      |> Steps.assert_on_join_page_with_invitation()
      |> Steps.follow_join_button()
      |> Steps.assert_you_are_member_of_the_company()
      |> Steps.assert_you_are_member_of_the_general_space()
      |> Steps.assert_you_are_redirected_to_company_home_page()
    end

    feature "the invited member is already part of the company", ctx do
      ctx
      |> Steps.given_the_invited_member_is_already_part_of_the_company()
      |> Steps.follow_invite_link()
      |> Steps.assert_on_join_page_with_invitation()
      |> Steps.follow_join_button()
      |> Steps.assert_you_are_member_of_the_company()
      |> Steps.assert_you_are_redirected_to_company_home_page()
    end
  end

  describe "existing user (not logged in)" do
    setup ctx do
      ctx
      |> Steps.given_the_invited_member_has_an_account()
      |> Steps.given_that_an_invite_link_exists()
      |> Steps.follow_invite_link()
      |> Steps.assert_on_join_page_with_invitation()
      |> Steps.follow_log_in_and_join()
    end

    feature "logs in via email and joins the company via invite link", ctx do
      ctx
      |> Steps.log_in_with_email()
      |> Steps.assert_you_are_member_of_the_company()
      |> Steps.assert_you_are_member_of_the_general_space()
      |> Steps.assert_you_are_redirected_to_company_home_page()
    end

    feature "logs in via google and joins the company via invite link", ctx do
      ctx
      |> Steps.log_in_with_google()
      |> Steps.assert_you_are_member_of_the_company()
      |> Steps.assert_you_are_member_of_the_general_space()
      |> Steps.assert_you_are_redirected_to_company_home_page()
    end
  end

  describe "new user (signing up)" do
    feature "signs up via email and joins the company via invite link", ctx do
      ctx
      |> Steps.given_that_an_invite_link_exists()
      |> Steps.follow_invite_link()
      |> Steps.assert_on_join_page_with_invitation()
      |> Steps.follow_sign_up_and_join()
      |> Steps.sign_up_with_email()
      |> Steps.assert_you_are_member_of_the_company()
      |> Steps.assert_you_are_member_of_the_general_space()
      |> Steps.assert_you_are_redirected_to_company_home_page()
    end

    feature "signs up via google and joins the company via invite link", ctx do
      ctx
      |> Steps.given_that_an_invite_link_exists()
      |> Steps.follow_invite_link()
      |> Steps.assert_on_join_page_with_invitation()
      |> Steps.follow_sign_up_and_join()
      |> Steps.sign_up_with_google()
      |> Steps.assert_you_are_member_of_the_company()
      |> Steps.assert_you_are_member_of_the_general_space()
      |> Steps.assert_you_are_redirected_to_company_home_page()
    end

    feature "shows error when email delivery is not configured", ctx do
      ctx
      |> Steps.given_email_delivery_is_not_configured()
      |> Steps.given_that_an_invite_link_exists()
      |> Steps.follow_invite_link()
      |> Steps.assert_on_join_page_with_invitation()
      |> Steps.follow_sign_up_and_join()
      |> Steps.attempt_sign_up_with_email()
      |> Steps.assert_email_delivery_not_configured_error()
    end
  end

  feature "attempting to join with non-existent token", ctx do
    ctx
    |> Steps.given_that_i_have_an_invalid_invite_link()
    |> Steps.follow_invite_link()
    |> Steps.assert_invalid_invite_link_message()
  end

  feature "invite-team page loads to admin user", ctx do
    ctx
    |> Steps.given_logged_in_user_is_admin()
    |> Steps.assert_user_has_admin_access_level()
    |> Steps.open_invite_team_page()
    |> Steps.assert_invite_link_visible()
  end

  feature "invite-team page shows 404 to non-admin user", ctx do
    ctx
    |> Steps.given_logged_in_user_is_not_admin()
    |> Steps.assert_user_has_edit_access_level()
    |> Steps.visit_invite_team_page()
    |> Steps.assert_404()
  end
end
