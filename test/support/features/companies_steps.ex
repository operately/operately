defmodule Operately.Support.Features.CompaniesSteps do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  step :given_a_user_is_logged_in_that_belongs_to_a_company, ctx do
    company = company_fixture(%{name: "Test Org"})
    person = person_fixture_with_account(%{full_name: "Kevin Kernel", company_id: company.id})

    ctx = Map.merge(ctx, %{company: company, person: person})
    ctx = UI.login_as(ctx, ctx.person)

    ctx
  end

  step :navigate_to_the_loby, ctx do
    ctx |> UI.visit("/")
  end

  step :click_on_the_add_company_button, ctx do
    ctx |> UI.click(testid: "add-company-card")
  end

  step :fill_in_company_form_and_submit, ctx do
    ctx
    |> UI.fill(testid: "companyname", with: "Acme Co.")
    |> UI.fill(testid: "title", with: "System Administrator")
    |> UI.click(testid: "submit")
    |> UI.assert_text("Acme Co.")
  end

  step :assert_company_is_created, ctx do
    company = Operately.Companies.get_company_by_name("Acme Co.")
    assert company != nil

    person = Ecto.assoc(company, :people) |> Repo.all() |> hd()
    assert person != nil
    assert person.title == "System Administrator"
    assert person.account_id == ctx.person.account_id

    ctx
  end

  step :assert_feed_displays_company_creation, ctx do
    company = Operately.Companies.get_company_by_name("Acme Co.")
    person = Ecto.assoc(company, :people) |> Repo.all() |> hd()

    ctx 
    |> UI.visit(Paths.feed_path(company))
    |> UI.assert_feed_item(person, "created this company")
  end

end
