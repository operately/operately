defmodule Operately.Features.LoginTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Support.Features.UI

  @google_sign_in_query Query.css("[data-test-id=sign-in-with-google]")

  setup ctx do
    company = company_fixture()
    person_fixture_with_account(%{company_id: company.id, full_name: "John Admin"})

    {:ok, ctx}
  end

  feature "Sign in with Google hidden", ctx do
    Application.put_env(:operately, :allow_login_with_google, false)

    ctx
    |> UI.visit("/")
    |> UI.assert_page("/log_in")
    |> UI.refute_has(@google_sign_in_query)
  end

  feature "Sign in with Google visible", ctx do
    Application.put_env(:operately, :allow_login_with_google, true)

    ctx
    |> UI.visit("/")
    |> UI.assert_page("/log_in")
    |> UI.assert_has(@google_sign_in_query)
  end
end
