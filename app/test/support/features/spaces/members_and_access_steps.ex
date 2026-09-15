defmodule Operately.Support.Features.Spaces.MembersAndAccessSteps do
  use Operately.FeatureCase

  alias Operately.Access.Binding

  step :given_inherited_access, ctx do
    ctx
    |> Factory.add_space(:space, company_permissions: Binding.view_access())
    |> Factory.add_company_member(:member)
  end

  step :visit_access_management, ctx do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> UI.click(testid: "access-management")
    |> UI.assert_has(testid: "space-access-management-page")
    |> then(fn ctx ->
      UI.execute("set_page_reload_marker", ctx, fn session ->
        Wallaby.Browser.execute_script(session, "window.spaceAccessPageReloadMarker = true")
      end)
    end)
  end

  step :assert_inherited_access, ctx do
    ctx = expand_other_people(ctx)
    UI.assert_text(ctx, ctx.member.full_name, testid: "other-people-list")
  end

  step :add_member, ctx do
    ctx
    |> UI.click(testid: "add-members")
    |> UI.select_person_in(testid: "members-0-personid", name: ctx.member.full_name)
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "space-access-management-page")
    |> UI.assert_text(ctx.member.full_name, testid: "members-section")
  end

  step :assert_no_inherited_access, ctx do
    ctx = expand_other_people(ctx)

    UI.assert_has(ctx, Query.css("[data-test-id='other-people-list']", text: ctx.member.full_name, count: 0))
  end

  step :remove_member, ctx do
    ctx
    |> UI.click(testid: UI.testid(["member", "menu", ctx.member.full_name]))
    |> UI.click(testid: "remove-member")
    |> UI.refute_has(testid: UI.testid(["member", "menu", ctx.member.full_name]))
    |> assert_inherited_access()
  end

  step :remove_general_company_access, ctx do
    ctx
    |> UI.click(css: "a[href$='/edit/general-access']")
    |> UI.select(testid: "access-companymembers", option: "No Access")
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "space-access-management-page")
  end

  step :assert_page_was_not_reloaded, ctx do
    UI.execute("assert_page_was_not_reloaded", ctx, fn session ->
      Wallaby.Browser.execute_script(session, "return window.spaceAccessPageReloadMarker === true", fn marker_present ->
        assert marker_present
      end)
    end)
  end

  defp expand_other_people(ctx) do
    if Wallaby.Browser.has?(ctx.session, UI.query(testid: "show-all-other-people")) do
      UI.click(ctx, testid: "show-all-other-people")
    else
      ctx
    end
  end
end
