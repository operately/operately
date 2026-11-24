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

  step :open_mobile_add_members_form, ctx do
    ctx
    |> Map.update!(:session, &Wallaby.Browser.resize_window(&1, 375, 812))
    |> UI.visit(Paths.space_path(ctx.company, ctx.marketing))
    |> UI.click(testid: "access-management")
    |> UI.click(testid: "add-members")
    |> UI.assert_has(testid: "member-0")
  end

  step :set_viewport, ctx, {width, height} do
    Map.update!(ctx, :session, &Wallaby.Browser.resize_window(&1, width, height))
  end

  step :use_dark_theme, ctx do
    UI.execute("use_dark_theme", ctx, fn session ->
      Wallaby.Browser.execute_script(session, "document.documentElement.classList.replace('light', 'dark')")
    end)
  end

  step :use_light_theme, ctx do
    UI.execute("use_light_theme", ctx, fn session ->
      Wallaby.Browser.execute_script(session, "document.documentElement.classList.replace('dark', 'light')")
    end)
  end

  step :assert_compact_member_layout, ctx, count do
    UI.execute("assert_compact_member_layout", ctx, fn session ->
      Wallaby.Browser.execute_script(
        session,
        """
          const members = [...document.querySelectorAll('[data-test-id^="member-"]')];
          const addButton = document.querySelector('[data-test-id="add-more"]');
          const submitButton = document.querySelector('[data-test-id="submit"]');
          const lastMember = members[members.length - 1];
          return {
            count: members.length,
            heights: members.map(member => member.getBoundingClientRect().height),
            addGap: addButton.getBoundingClientRect().top - lastMember.getBoundingClientRect().bottom,
            submitGap: submitButton.getBoundingClientRect().top - addButton.getBoundingClientRect().bottom,
            hasOverflow: document.documentElement.scrollWidth > window.innerWidth + 1
          };
        """,
        fn geometry ->
          assert geometry["count"] == count
          assert Enum.all?(geometry["heights"], &(&1 < 500))
          assert geometry["addGap"] >= 0 and geometry["addGap"] < 80
          assert geometry["submitGap"] >= 0 and geometry["submitGap"] < 100
          refute geometry["hasOverflow"]
        end
      )
    end)
  end

  step :select_member, ctx, {index, person} do
    UI.select_person_in(ctx, testid: "members-#{index}-personid", name: person.full_name)
  end

  step :select_member_access, ctx, {index, access} do
    ctx
    |> UI.select(testid: "members-#{index}-accesslevel", option: access)
    |> UI.assert_text(access, testid: "members-#{index}-accesslevel")
  end

  step :add_another_member, ctx do
    UI.click(ctx, testid: "add-more")
  end

  step :remove_additional_member, ctx, index do
    UI.click(ctx, testid: "remove-member-#{index}")
  end

  step :submit_members, ctx do
    ctx
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "space-access-management-page")
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
