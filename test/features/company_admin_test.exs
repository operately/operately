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

    {:ok, ctx}
  end

  feature "adding a new person to the company", ctx do
    ctx
    |> UI.login_as(ctx.admin)
    |> visit_page()
    |> UI.click(testid: "add-remove-people")
    |> UI.click(testid: "add-person")
    |> UI.fill(testid: "person-full-name", with: "Michael Scott")
    |> UI.fill(testid: "person-email", with: "m.scott@dmif.com")
    |> UI.fill(testid: "person-title", with: "Regional Manager")
    |> UI.click(testid: "save")

    person = Operately.People.get_by_email("m.scott@dmif.com")

    assert person != nil
    assert person.company_id == ctx.company.id
    assert person.full_name == "Michael Scott"
    assert person.title == "Regional Manager"
  end

  feature "promote a person to admin", ctx do
    person = person_fixture(%{full_name: "Michael Scott", company_id: ctx.company.id, title: "Regional Manager"})

    ctx
    |> UI.login_as(ctx.admin)
    |> visit_page()
    |> UI.click(testid: "add-remove-admins")
    |> UI.click(testid: "add-admin")
    |> UI.fill(testid: "person-query", with: "Michael Scott")
    |> UI.click(testid: "add")

    person = Operately.People.get_by_email("m.scott@dmif.com")

    assert person != nil
    assert person.company_id == ctx.company.id
    assert person.company_role == "admin"
  end

  feature "demote a person from admin", ctx do
    person = person_fixture(%{full_name: "Michael Scott", company_id: ctx.company.id, title: "Regional Manager"})

    ctx
    |> UI.login_as(ctx.admin)
    |> visit_page()
    |> UI.click(testid: "add-remove-admins")
    |> UI.click(testid: "demote-michael-scott")
    |> UI.refute_text("Michael Scott")

    person = Operately.People.get_by_email("m.scott@dmif.com")

    assert person != nil
    assert person.company_id == ctx.company.id
    assert person.company_role == "member"
  end

  #
  # ======== Helper functions ========
  #

  defp visit_page(ctx, project) do
    UI.visit(ctx, "/company/admin")
  end

end
