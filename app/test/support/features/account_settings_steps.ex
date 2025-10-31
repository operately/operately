defmodule Operately.Support.Features.AccountSettingsSteps do
  use Operately.FeatureCase

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:person, full_name: "John Johnson", email: "hello@localhost", password: "abcd1234ABCD")
    |> Factory.log_in_person(:person)
  end

  step :change_theme, ctx, theme do
    ctx = try do
      # Try to find and click appearance-link within the account page content
      UI.find(ctx, UI.query(testid: "my-account-page"), fn el ->
        UI.click(el, testid: "appearance-link")
      end)
    rescue
      _ ->
        # If not on account page, use the dropdown menu
        ctx
        |> UI.click(testid: "account-menu")
        |> UI.click(testid: "appearance-link")
    end

    ctx
    |> UI.click(testid: "color-mode-#{theme}")
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "my-account-page")
  end

  step :assert_person_has_theme, ctx, theme do
    assert Operately.People.get_person!(ctx.person.id).theme == theme
    ctx
  end

  step :open_account_settings, ctx do
    ctx
    |> UI.click(testid: "account-menu")
    |> UI.click(testid: "profile-link")
  end

  step :change_name, ctx, name do
    ctx
    |> UI.fill(testid: "name", with: name)
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "my-account-page")
  end

  step :assert_person_name_changed, ctx, name do
    assert Operately.People.get_person!(ctx.person.id).full_name == name
    ctx
  end

  step :change_title, ctx, title do
    ctx
    |> UI.fill(testid: "title", with: title)
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "my-account-page")
  end

  step :assert_person_title_changed, ctx, title do
    assert Operately.People.get_person!(ctx.person.id).title == title
    ctx
  end

  step :change_timezone, ctx, props do
    ctx
    |> UI.select(testid: "timezone", option: props[:label])
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "my-account-page")
  end

  step :assert_person_timezone_changed, ctx, props do
    assert Operately.People.get_person!(ctx.person.id).timezone == props[:value]

    ctx
    |> UI.find(UI.query(testid: "my-account-page"), fn el ->
      UI.click(el, testid: "profile-link")
    end)
    |> UI.assert_text(props[:label])
  end

  step :given_a_person_exists_in_company, ctx, manager_name do
    {:ok, _} =
      ctx.person
      |> Operately.People.get_peers()
      |> hd()
      |> Operately.People.update_person(%{full_name: manager_name})

    ctx
  end

  step :set_manager, ctx, manager_name do
    ctx
    |> UI.click(testid: "manager")
    |> UI.click(testid: UI.testid(["manager-search-result", manager_name]))
    |> UI.sleep(100)
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "my-account-page")
  end

  step :assert_person_manager_set, ctx, manager_name do
    manager = Operately.People.get_person_by_name!(ctx.company, manager_name)
    assert Operately.People.get_person!(ctx.person.id).manager_id == manager.id
    ctx
  end

  step :given_that_i_have_a_manager, ctx do
    ctx
    |> Factory.add_company_member(:manager, full_name: "John Adams")
    |> then(fn ctx ->
      Operately.People.update_person(ctx.person, %{manager_id: ctx.manager.id})
      ctx
    end)
  end

  step :set_no_manager, ctx do
    ctx
    |> UI.click(testid: "manager")
    |> UI.click(testid: "manager-clear-assignment")
    |> UI.sleep(100)
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "my-account-page")
  end

  step :assert_person_has_no_manager, ctx do
    assert Operately.People.get_person!(ctx.person.id).manager_id == nil
    ctx
  end

  step :navigate_to_password_reset_page, ctx do
    ctx
    |> UI.click(testid: "account-menu")
    |> UI.click(testid: "password-link")
    |> UI.click(testid: "change-password")
    |> UI.assert_has(testid: "change-password-page")
  end

  step :fill_in_reset_password_form, ctx do
    ctx
    |> UI.fill(testid: "currentPassword", with: "abcd1234ABCD")
    |> UI.fill(testid: "newPassword", with: "new-password-123")
    |> UI.fill(testid: "confirmPassword", with: "new-password-123")
  end

  step :submit_reset_password_form, ctx do
    ctx
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "account-security-page")
  end

  step :assert_password_changed, ctx do
    account = Operately.People.get_account!(ctx.person.account_id)
    assert Operately.People.Account.valid_password?(account, "new-password-123")

    ctx
  end

end
