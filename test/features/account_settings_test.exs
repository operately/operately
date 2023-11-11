defmodule Operately.Features.AccountSettingsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  setup ctx do
    company = company_fixture(%{name: "Test Org"})
    person = person_fixture_with_account(%{company_id: company.id, full_name: "John Johnson"})

    ctx = UI.init_ctx(ctx, %{company: company, person: person})
    ctx = UI.login_as(ctx, ctx.person)

    ctx
  end

  feature "changing operately's theme", ctx do
    ctx
    |> change_theme("light")
    |> assert_person_has_theme("light")
    |> change_theme("dark")
    |> assert_person_has_theme("dark")
    |> change_theme("system")
    |> assert_person_has_theme("system")
  end

  defp change_theme(ctx, theme) do
    ctx
    |> UI.visit("/account")
    |> UI.click(testid: "appearance-link")
    |> UI.click(testid: "color-mode-#{theme}")
    |> UI.click(testid: "save")
    |> UI.wait_for_page_to_load("/account")
  end

  defp assert_person_has_theme(ctx, theme) do
    assert Operately.People.get_person!(ctx.person.id).theme == theme
    ctx
  end
end
