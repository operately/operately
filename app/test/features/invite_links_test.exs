defmodule Operately.Features.InviteLinksTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.InviteLinksSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  # feature "New signup generates invite link", ctx do
  #   ctx
  #   |> Factory.log_in_person(:creator)
  #   |> Steps.visit_team_invite_page()
  #   |> Steps.assert_invite_team_page_loaded()
  #   |> Steps.generate_invite_link()
  #   |> Steps.assert_invite_link_generated_successfully()
  # end

  # feature "Admin views invite links", ctx do
  #   ctx
  #   |> Steps.create_invite_link()
  #   |> Factory.log_in_person(:creator)
  #   |> Steps.visit_admin_manage_people_page()
  #   |> Steps.assert_invite_links_section_visible()
  # end

  # feature "Admin revokes invite link", ctx do
  #   ctx
  #   |> Steps.create_invite_link()
  #   |> Factory.log_in_person(:creator)
  #   |> Steps.visit_admin_manage_people_page()
  #   |> assert_has(Query.text("Active"))
  #   |> Steps.revoke_invite_link()
  #   |> Steps.assert_invite_link_revoked()
  # end

  feature "new user signs up via email and joins the company via invite link", ctx do
    ctx
    |> Steps.given_that_an_invite_link_exists()
    |> Steps.follow_invite_link()
    |> Steps.assert_on_join_page_with_invitation()
    |> Steps.follow_sign_up_and_join()
    |> Steps.assert_you_member_of_the_company()
    |> Steps.assert_you_are_redirected_to_company_home_page()
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
