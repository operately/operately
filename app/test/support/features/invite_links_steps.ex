defmodule Operately.Support.Features.InviteLinksSteps do
  use Operately.FeatureCase

  alias Operately.Support.Factory
  alias Operately.Support.Features.UI.Emails, as: Emails

  step :setup, ctx do
    ctx |> Factory.setup()
  end

  step :given_that_an_invite_link_exists, ctx do
    {:ok, invite_link} =
      Operately.InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      })

    Map.put(ctx, :invite_link, invite_link)
  end

  step :given_that_an_expired_invite_link_exists, ctx do
    {:ok, invite_link} =
      Operately.InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id,
        expires_at: DateTime.add(DateTime.utc_now(), -1, :day)
      })

    Map.put(ctx, :invite_link, invite_link)
  end

  step :follow_invite_link, ctx do
    ctx
    |> UI.visit("/join/#{ctx.invite_link.token}")
  end

  step :assert_on_join_page_with_invitation, ctx do
    ctx
    |> UI.assert_text("#{ctx.creator.full_name} invited you to join")
    |> UI.assert_text(ctx.company.name)
    |> UI.assert_text("Sign Up & Join")
  end

  step :follow_sign_up_and_join, ctx do
    email = "hello@test.localhost"

    ctx
    |> UI.click(testid: "sign-up-and-join")
    |> UI.click(testid: "sign-up-with-email")
    |> UI.fill(testid: "email", with: email)
    |> UI.fill(testid: "name", with: "Michael")
    |> UI.fill(testid: "password", with: "123456789ABCder")
    |> UI.fill(testid: "confirmPassword", with: "123456789ABCder")
    |> UI.click(testid: "submit")
    |> then(fn ctx ->
      emails = Emails.wait_for_email_for(email, attempts: 10)
      email = Enum.find(emails, fn email -> String.contains?(email.subject, "Operately confirmation code:") end)
      code = String.split(email.subject, "Operately confirmation code:") |> List.last()

      ctx
      |> UI.fill(testid: "code", with: code)
      |> UI.click(testid: "submit")
    end)
    |> UI.sleep(500)
  end

  step :assert_you_member_of_the_company, ctx do
    members = Operately.People.list_people(ctx.company.id)
    assert Enum.any?(members, fn member -> member.email == "hello@test.localhost" end)

    ctx
  end

  step :assert_you_are_redirected_to_company_home_page, ctx do
    ctx
    |> UI.assert_text(ctx.company.name)
    |> UI.assert_has(testid: "company-home")
  end

  # step :create_expired_invite_link, ctx do
  #   {:ok, invite_link} =
  #     Operately.InviteLinks.create_invite_link(%{
  #       company_id: ctx.company.id,
  #       author_id: ctx.creator.id,
  #       expires_at: DateTime.add(DateTime.utc_now(), -1, :day)
  #     })

  #   Map.put(ctx, :invite_link, invite_link)
  # end

  # step :create_and_revoke_invite_link, ctx do
  #   {:ok, invite_link} =
  #     Operately.InviteLinks.create_invite_link(%{
  #       company_id: ctx.company.id,
  #       author_id: ctx.creator.id
  #     })

  #   {:ok, revoked_link} = Operately.InviteLinks.revoke_invite_link(invite_link)

  #   Map.put(ctx, :invite_link, revoked_link)
  # end

  # step :visit_team_invite_page, ctx do
  #   ctx
  #   |> visit_page("/#{ctx.company.id}/invite-team")
  # end

  # step :visit_admin_manage_people_page, ctx do
  #   ctx
  #   |> visit_page("/#{ctx.company.id}/admin/manage-people")
  # end

  # step :visit_invite_join_page_with_token, ctx do
  #   ctx
  #   |> visit_page("/join/#{ctx.invite_link.token}")
  # end

  # step :visit_invite_join_page_with_invalid_token, ctx do
  #   ctx
  #   |> visit_page("/join/invalid-token-123")
  # end

  # step :generate_invite_link, ctx do
  #   ctx
  #   |> click(Query.button("Generate Invite Link"))
  # end

  # step :revoke_invite_link, ctx do
  #   ctx
  #   |> click(Query.button("Revoke"))
  #   |> accept_browser_dialog()
  # end

  # step :assert_invite_team_page_loaded, ctx do
  #   ctx
  #   |> assert_has(Query.text("Invite Your Team"))
  # end

  # step :assert_invite_link_generated_successfully, ctx do
  #   ctx
  #   |> assert_has(Query.text("Invite link generated successfully!"))
  #   |> assert_has(Query.text("Shareable Link"))
  #   |> assert_has(Query.text("Message Template"))
  # end

  # step :assert_invite_links_section_visible, ctx do
  #   ctx
  #   |> assert_has(Query.text("Invite Links"))
  #   |> assert_has(Query.text("Invite Link"))
  #   |> assert_has(Query.text("Active"))
  #   |> assert_has(Query.text("Created by #{ctx.creator.full_name}"))
  # end

  # step :assert_invite_link_revoked, ctx do
  #   ctx
  #   |> assert_has(Query.text("Revoked"))
  #   |> refute_has(Query.button("Revoke"))
  # end

  # step :assert_welcome_page_with_invitation, ctx do
  #   ctx
  #   |> assert_has(Query.text("Welcome to Operately!"))
  #   |> assert_has(Query.text("#{ctx.creator.full_name} invited you to join"))
  #   |> assert_has(Query.text("Sign Up & Join"))
  # end

  step :assert_expired_invite_link_message, ctx do
    ctx
    |> UI.assert_text("This invite link has expired")
    |> UI.take_screenshot()
  end

  # step :assert_revoked_invite_link_message, ctx do
  #   ctx
  #   |> assert_has(Query.text("Invite Link Expired"))
  #   |> assert_has(Query.text("This invite link is no longer valid"))
  # end

  # step :assert_invalid_invite_link_message, ctx do
  #   ctx
  #   |> assert_has(Query.text("Invalid Invite Link"))
  #   |> assert_has(Query.text("This invite link is invalid or has expired"))
  # end
end
