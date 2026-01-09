defmodule Operately.Support.Features.HomeSteps do
  use Operately.FeatureCase
  alias Operately.Support.Features.UI

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  step :given_a_company_exists, ctx do
    company = company_fixture(%{name: "Target Company"})
    Map.put(ctx, :company, company)
  end

  step :given_a_user_is_logged_in_as_member, ctx do
    person = person_fixture_with_account(%{company_id: ctx.company.id, full_name: "Member Person"})
    ctx = Map.put(ctx, :person, person)
    UI.login_as(ctx, person)
  end

  step :given_a_user_is_logged_in_as_non_member, ctx do
    other_company = company_fixture(%{name: "Other Company"})
    person = person_fixture_with_account(%{company_id: other_company.id, full_name: "Outsider Person"})
    ctx = Map.put(ctx, :person, person)
    UI.login_as(ctx, person)
  end

  step :visit_company_home_page, ctx do
    path = OperatelyWeb.Paths.home_path(ctx.company)
    UI.visit(ctx, path)
  end

  step :assert_company_page_loaded, ctx do
    ctx
    |> UI.assert_text(ctx.company.name)
    |> UI.refute_text("Page Not Found")
  end

  step :assert_404_page, ctx do
    ctx
    |> UI.assert_text("Page Not Found")
    |> UI.refute_text(ctx.company.name)
  end
end
