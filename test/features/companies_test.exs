defmodule Operately.Features.CompaniesTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Support.Features.UI

  setup ctx do
    company = company_fixture(%{name: "Test Org"})
    person = person_fixture_with_account(%{full_name: "Kevin Kernel", company_id: company.id})

    ctx = Map.merge(ctx, %{company: company, person: person})
    ctx = UI.login_as(ctx, ctx.person)

    ctx
  end

  feature "creating a new company", ctx do
    ctx
    |> UI.visit("/")
    |> UI.click(testid: "add-company-card")
    |> UI.fill(testid: "companyname", with: "Acme Co.")
    |> UI.fill(testid: "title", with: "System Administrator")
    |> UI.click(testid: "submit")
    |> UI.assert_text("Acme Co.")

    company = Operately.Companies.get_company_by_name("Acme Co.")
    assert company != nil

    person = Ecto.assoc(company, :people) |> Repo.all() |> hd()
    assert person != nil
    assert person.title == "System Administrator"
    assert person.account_id == ctx.person.account_id
  end
end
