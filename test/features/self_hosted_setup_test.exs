defmodule Operately.Features.SelfHostedSetupTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.SelfHostedSetupSteps, as: Steps

  @company_info %{
    company_name: "Acme Co.",
    full_name: "John Doe",
    email: "john@your-company.com",
    title: "CEO",
    password: "Aa12345#&!123",
    password_confirmation: "Aa12345#&!123"
  }

  feature "setting up a self-hosted instance", ctx do
    ctx
    |> Steps.open_operately()
    |> Steps.assert_on_the_setup_page()
    |> Steps.fill_out_setup_form(@company_info)
    |> Steps.submit_setup_form()
    |> Steps.assert_on_company_home()
    |> Steps.assert_account_and_company_created(@company_info)
    |> Steps.assert_setup_page_is_no_longer_accessible()
  end

end
