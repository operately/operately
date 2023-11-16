defmodule Operately.Features.ErrorsTest do
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

  feature "visiting a non existing page", ctx do
    ctx
    |> UI.visit("/non-existing-page")
    |> UI.assert_text("Page Not Found")
    |> UI.click(testid: "back-to-lobby")
    |> UI.assert_text("Lobby")
  end

  feature "error page", ctx do
    ctx
    |> UI.visit("/spaces/123")
    |> UI.assert_text("Oops! Something went wrong.")
    |> UI.click(testid: "back-to-lobby")
    |> UI.assert_text("Lobby")
  end
end
