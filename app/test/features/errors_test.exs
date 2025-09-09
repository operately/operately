defmodule Operately.Features.ErrorsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.UI

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  setup ctx do
    company = company_fixture(%{name: "Test Org"})
    person = person_fixture_with_account(%{company_id: company.id, full_name: "John Johnson"})

    ctx = UI.init_ctx(ctx, %{company: company, person: person})
    ctx = UI.login_as(ctx, person)

    ctx
  end

  feature "visiting a non-existing route outside company context", ctx do
    ctx
    |> UI.visit("/hello")
    |> UI.assert_text("Page Not Found")
    |> UI.assert_text("Sorry, we couldn't find that page you were looking for.")
  end

  feature "visiting a non-existing route with company-like path but invalid", ctx do
    ctx
    |> UI.visit("/invalid-company-id/some-page")
    |> UI.assert_text("Page Not Found")
  end

  feature "visiting a non-existing route inside company context", ctx do
    ctx
    |> UI.visit(Paths.home_path(ctx.company) <> "/non-existing-page")
    |> UI.assert_text("Page Not Found")
  end

  feature "resource not found", ctx do
    fake_space = %Operately.Groups.Group{id: Ecto.UUID.generate(), name: "Test Space"}

    ctx
    |> UI.visit(Paths.space_path(ctx.company, fake_space))
    |> UI.assert_text("Page Not Found")
  end
end
