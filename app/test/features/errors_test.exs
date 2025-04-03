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

  feature "visiting a non-existing route", ctx do
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
