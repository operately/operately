defmodule Operately.Support.Features.AccountSettingsSteps do
  use Operately.FeatureCase
  alias Operately.Support.Features.UI

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  step :setup, ctx do
    company = company_fixture(%{name: "Test Org"})
    person = person_fixture_with_account(%{company_id: company.id, full_name: "John Johnson"})

    ctx = UI.init_ctx(ctx, %{company: company, person: person})

    UI.login_as(ctx, ctx.person)
  end

  step :change_theme, ctx, theme do
    ctx
    |> UI.visit(Paths.account_path(ctx.company))
    |> UI.click(testid: "appearance-link")
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
    |> UI.visit(Paths.account_path(ctx.company))
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

  step :change_timezone, ctx, timezone do
    ctx
    |> UI.select(testid: "timezone", option: timezone)
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "my-account-page")
  end

  step :assert_person_timezone_changed, ctx, timezone do
    assert Operately.People.get_person!(ctx.person.id).timezone == timezone
    ctx
  end

  step :set_select_manager_from_list, ctx do
    ctx |> UI.click(testid: "managerStatus-select-from-list")
  end

  step :given_a_person_exists_in_company, ctx, manager_name do
    person_fixture_with_account(%{company_id: ctx.company.id, full_name: manager_name})
    ctx
  end

  step :set_manager, ctx, manager_name do
    ctx
    |> UI.select_person_in(id: "manager", name: manager_name)
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "my-account-page")
  end

  step :assert_person_manager_set, ctx, manager_name do
    manager = Operately.People.get_person_by_name!(ctx.company, manager_name)
    assert Operately.People.get_person!(ctx.person.id).manager_id == manager.id
    ctx
  end

  step :given_that_i_have_a_manager, ctx do
    manager = person_fixture_with_account(%{company_id: ctx.company.id, full_name: "John Adams"})
    Operately.People.update_person(ctx.person, %{manager_id: manager.id})
    ctx
  end

  step :set_no_manager, ctx do
    ctx
    |> UI.click(testid: "managerStatus-no-manager")
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "my-account-page")
  end

  step :assert_person_has_no_manager, ctx do
    assert Operately.People.get_person!(ctx.person.id).manager_id == nil
    ctx
  end

end
