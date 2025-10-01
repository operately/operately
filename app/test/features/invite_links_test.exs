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

  feature "new user signs up and joins the company via invite link", ctx do
    ctx
    |> Steps.given_that_an_invite_link_exists()
    |> Steps.follow_invite_link()
    |> Steps.assert_on_join_page_with_invitation()
    |> Steps.follow_sign_up_and_join()
    |> Steps.assert_you_are_in_the_company()
  end

  # feature "Attempting to join with expired token", ctx do
  #   ctx
  #   |> Steps.create_expired_invite_link()
  #   |> Steps.visit_invite_join_page_with_token()
  #   |> Steps.assert_expired_invite_link_message()
  # end

  # feature "Attempting to join with revoked token", ctx do
  #   ctx
  #   |> Steps.create_and_revoke_invite_link()
  #   |> Steps.visit_invite_join_page_with_token()
  #   |> Steps.assert_revoked_invite_link_message()
  # end

  # feature "Attempting to join with non-existent token", ctx do
  #   ctx
  #   |> Steps.visit_invite_join_page_with_invalid_token()
  #   |> Steps.assert_invalid_invite_link_message()
  # end
end
