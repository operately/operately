defmodule Operately.Features.InviteLinksTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.InviteLinksSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

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
      |> Steps.assert_you_are_member_of_the_general_space()
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
  end

  feature "attempting to join with expired token", ctx do
    ctx
    |> Steps.given_that_an_expired_invite_link_exists()
    |> Steps.follow_invite_link()
    |> Steps.assert_expired_invite_link_message()
  end

  feature "attempting to join with revoked token", ctx do
    ctx
    |> Steps.given_that_a_revoked_invite_link_exists()
    |> Steps.follow_invite_link()
    |> Steps.assert_expired_invite_link_message()
  end

  feature "attempting to join with non-existent token", ctx do
    ctx
    |> Steps.given_that_i_have_an_invalid_invite_link()
    |> Steps.follow_invite_link()
    |> Steps.assert_invalid_invite_link_message()
  end
end
