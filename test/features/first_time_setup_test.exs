defmodule Operately.Features.FirstTimeSetupTest do
  use Operately.FeatureCase
  import Operately.CompaniesFixtures

  alias Operately.Support.Features.UI


  feature "redirects to /first-time-setup", ctx do
    ctx
    |> UI.visit("/")
    |> UI.assert_page("/first-time-setup")

    ctx
    |> UI.visit("/people")
    |> UI.assert_page("/first-time-setup")
  end

  feature "redirects from /first-time-setup", ctx do
    company_fixture(%{name: "Test Company"})

    ctx
    |> UI.visit("/first-time-setup")
    |> UI.assert_page("/accounts/log_in")
  end
end
