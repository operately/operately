defmodule Operately.Support.Features.RoleSetupSteps do
  use Operately.FeatureCase

  step :setup, ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_account(:member_account)
    {:ok, invite} = Operately.InviteLinks.create_invite_link(%{company_id: ctx.company.id, author_id: ctx.creator.id})
    {:ok, member} = Operately.InviteLinks.join_company_via_invite_link(ctx.member_account, invite.token)

    ctx |> Map.put(:member, member) |> Factory.log_in_person(:member)
  end

  step :use_narrow_window, ctx do
    Map.update!(ctx, :session, &Wallaby.Browser.resize_window(&1, 390, 844))
  end

  step :visit_profile, ctx do
    UI.visit(ctx, Paths.profile_path(ctx.company, ctx.member))
  end

  step :assert_prompt_visible, ctx do
    ctx |> UI.assert_has(testid: "title-setup-prompt") |> UI.take_screenshot()
  end

  step :save_role, ctx do
    ctx |> UI.fill(testid: "onboardingtitle", with: "  Designer  ") |> UI.click(testid: "save-title")
  end

  step :skip_role, ctx do
    UI.click(ctx, testid: "skip-title")
  end

  step :assert_setup_complete, ctx, title do
    ctx = ctx |> UI.refute_has(testid: "title-setup-prompt") |> UI.assert_page(Paths.profile_path(ctx.company, ctx.member))
    member = Operately.Repo.reload!(ctx.member)
    refute member.title_setup_pending
    assert member.title == title
    ctx
  end

  step :assert_prompt_absent, ctx do
    ctx |> UI.assert_has(testid: "tab-about") |> UI.refute_has(testid: "title-setup-prompt")
  end
end
