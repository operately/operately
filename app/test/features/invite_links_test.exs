defmodule Operately.Features.InviteLinksTest do
  use Operately.FeatureCase

  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
  end

  feature "New signup generates invite link", ctx do
    ctx
    |> Factory.log_in_person(:creator)
    |> visit_page("/#{ctx.company.id}/invite-team")
    |> assert_has(Query.text("Invite Your Team"))
    |> click(Query.button("Generate Invite Link"))
    |> assert_has(Query.text("Invite link generated successfully!"))
    |> assert_has(Query.text("Shareable Link"))
    |> assert_has(Query.text("Message Template"))
  end

  feature "Admin views invite links", ctx do
    # Create an invite link first
    {:ok, invite_link} = Operately.InviteLinks.create_invite_link(%{
      company_id: ctx.company.id,
      author_id: ctx.creator.id
    })

    ctx
    |> Factory.log_in_person(:creator)
    |> visit_page("/#{ctx.company.id}/admin/manage-people")
    |> assert_has(Query.text("Invite Links"))
    |> assert_has(Query.text("Invite Link"))
    |> assert_has(Query.text("Active"))
    |> assert_has(Query.text("Created by #{ctx.creator.full_name}"))
  end

  feature "Admin revokes invite link", ctx do
    # Create an invite link first
    {:ok, invite_link} = Operately.InviteLinks.create_invite_link(%{
      company_id: ctx.company.id,
      author_id: ctx.creator.id
    })

    ctx
    |> Factory.log_in_person(:creator)
    |> visit_page("/#{ctx.company.id}/admin/manage-people")
    |> assert_has(Query.text("Active"))
    |> click(Query.button("Revoke"))
    |> accept_browser_dialog()
    |> assert_has(Query.text("Revoked"))
    |> refute_has(Query.button("Revoke"))
  end

  feature "New user signs up via invite link", ctx do
    # Create an invite link first
    {:ok, invite_link} = Operately.InviteLinks.create_invite_link(%{
      company_id: ctx.company.id,
      author_id: ctx.creator.id
    })

    ctx
    |> visit_page("/join/#{invite_link.token}")
    |> assert_has(Query.text("Welcome to Operately!"))
    |> assert_has(Query.text("#{ctx.creator.full_name} invited you to join"))
    |> assert_has(Query.text("Sign Up & Join"))
  end

  feature "Attempting to join with expired token", ctx do
    # Create an expired invite link
    {:ok, invite_link} = Operately.InviteLinks.create_invite_link(%{
      company_id: ctx.company.id,
      author_id: ctx.creator.id,
      expires_at: DateTime.add(DateTime.utc_now(), -1, :day)
    })

    ctx
    |> visit_page("/join/#{invite_link.token}")
    |> assert_has(Query.text("Invite Link Expired"))
    |> assert_has(Query.text("This invite link has expired"))
    |> assert_has(Query.text("Please contact #{ctx.creator.full_name} for a new invite link"))
  end

  feature "Attempting to join with revoked token", ctx do
    # Create and revoke an invite link
    {:ok, invite_link} = Operately.InviteLinks.create_invite_link(%{
      company_id: ctx.company.id,
      author_id: ctx.creator.id
    })
    
    {:ok, _} = Operately.InviteLinks.revoke_invite_link(invite_link)

    ctx
    |> visit_page("/join/#{invite_link.token}")
    |> assert_has(Query.text("Invite Link Expired"))
    |> assert_has(Query.text("This invite link is no longer valid"))
  end

  feature "Attempting to join with non-existent token", ctx do
    ctx
    |> visit_page("/join/invalid-token-123")
    |> assert_has(Query.text("Invalid Invite Link"))
    |> assert_has(Query.text("This invite link is invalid or has expired"))
  end
end