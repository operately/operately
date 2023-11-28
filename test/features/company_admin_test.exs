defmodule Operately.Features.CompanyAdminTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  setup ctx do
    company = company_fixture(%{name: "Dunder Mifflin"})

    admin = person_fixture_with_account(%{
      full_name: "Dwight Schrute", 
      company_id: company.id, 
      title: "Assistant to the Regional Manager", 
      company_role: "admin"
    })

    ctx = Map.put(ctx, :company, company)
    ctx = Map.put(ctx, :admin, admin)

    ctx
    |> UI.login_as(ctx.admin)
    |> visit_page()
  end

  feature "adding a new person to the company", ctx do
    ctx
    |> UI.click(testid: "add-remove-people")
    |> UI.click(testid: "add-person")
    |> UI.fill(testid: "person-full-name", with: "Michael Scott")
    |> UI.fill(testid: "person-email", with: "m.scott@dmif.com")
    |> UI.fill(testid: "person-title", with: "Regional Manager")
    |> UI.click(testid: "submit")

    person = Operately.People.get_person_by_name!("Michael Scott")

    assert person != nil
    assert person.company_id == ctx.company.id
    assert person.full_name == "Michael Scott"
    assert person.title == "Regional Manager"
  end

  feature "promote a person to admin", ctx do
    person_fixture(%{full_name: "Michael Scott", company_id: ctx.company.id, title: "Regional Manager"})

    ctx
    |> UI.click(testid: "manage-company-administrators")
    |> UI.click(testid: "add-admins")
    |> UI.fill_in(Query.css("#peopleSearch"), with: "Mich")
    |> UI.assert_text("Michael Scott")
    |> UI.send_keys([:enter])
    |> UI.click(testid: "save-admins")

    michael = Operately.People.get_person_by_name!("Michael Scott")
    assert michael != nil
    assert michael.company_id == ctx.company.id
    assert michael.company_role == :admin
  end

  feature "demote a person from admin", ctx do
    person_fixture(%{full_name: "Michael Scott", company_id: ctx.company.id, title: "Regional Manager", company_role: :admin})

    ctx
    |> UI.click(testid: "manage-company-administrators")
    |> UI.click(testid: "remove-michael-scott")
    |> UI.refute_text("Michael Scott")

    person = Operately.People.get_person_by_name!("Michael Scott")

    assert person != nil
    assert person.company_id == ctx.company.id
    assert person.company_role == :member
  end

  #
  # ======== Helper functions ========
  #

  defp visit_page(ctx) do
    UI.visit(ctx, "/company/admin")
  end

end
