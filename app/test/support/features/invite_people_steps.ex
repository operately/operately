defmodule Operately.Support.Features.InvitePeopleSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI

  step :open_invite_page_from_home, ctx do
    ctx
    |> UI.visit(Paths.home_path(ctx.company))
    |> UI.assert_has(testid: "invite-people")
    |> UI.click(testid: "invite-people")
    |> UI.assert_has(testid: "invite-people-page")
  end

  step :open_invite_page_from_admin, ctx do
    ctx
    |> UI.visit(Paths.company_admin_path(ctx.company))
    |> UI.click(testid: "invite-people")
    |> UI.assert_has(testid: "invite-people-page")
  end

  step :generate_invite_link, ctx do
    ctx
    |> UI.click(testid: "generate-invite-link")
    |> UI.assert_has(testid: "copy-invite-link")
  end

  step :assert_link_metadata_visible, ctx do
    ctx |> UI.assert_text("Generated")
  end

  step :assert_invite_link_field_visible, ctx do
    ctx |> UI.assert_has(testid: "copy-invite-link")
  end

  step :follow_manage_people_link, ctx do
    ctx
    |> UI.click(testid: "manage-team-members")
    |> UI.assert_has(testid: "manage-people-page")
  end

  step :trigger_copy, ctx do
    ctx |> UI.click(testid: "copy-invite-link")
  end

  step :assert_copy_button_label, ctx, label do
    ctx |> UI.assert_text(label)
  end
end
