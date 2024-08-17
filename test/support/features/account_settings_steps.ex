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
    |> UI.click(testid: "save")
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

end
