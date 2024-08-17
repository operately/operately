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
    |> UI.wait_for_page_to_load(Paths.account_path(ctx.company))
  end

  step :assert_person_has_theme, ctx, theme do
    assert Operately.People.get_person!(ctx.person.id).theme == theme
    ctx
  end

end
