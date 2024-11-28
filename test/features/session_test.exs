defmodule Operately.Features.SessionTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.SessionTestSteps, as: Steps

  @account_info %{
    email: "hello@localhost.test",
    password: "Aa12345#&!123"
  }

  setup ctx, do: Factory.setup(ctx)

  feature "successful login", ctx do
    ctx
    |> Steps.assert_i_have_an_account(@account_info)
    |> Steps.open_operately()
    |> Steps.assert_on_the_login_page()
    |> Steps.fill_out_login_form(@account_info)
    |> Steps.submit_login_form()
    |> Steps.assert_on_the_company_home_page()
  end

  feature "login with incorrect email", ctx do
    ctx
    |> Steps.assert_i_have_an_account(@account_info)
    |> Steps.open_operately()
    |> Steps.assert_on_the_login_page()
    |> Steps.fill_out_login_form(%{email: "non-existing@email.com", password: @account_info[:password]})
    |> Steps.submit_login_form()
    |> Steps.assert_invalid_email_error()
  end

  feature "login with incorrect password", ctx do
    ctx
    |> Steps.assert_i_have_an_account(@account_info)
    |> Steps.open_operately()
    |> Steps.assert_on_the_login_page()
    |> Steps.fill_out_login_form(%{email: @account_info[:email], password: "incorrect-password"})
    |> Steps.submit_login_form()
    |> Steps.assert_wrong_password_error()
  end

end
