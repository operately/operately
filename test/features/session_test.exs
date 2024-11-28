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
    |> Steps.given_i_have_an_account(@account_info)
    |> Steps.open_operately()
    |> Steps.assert_on_the_login_page()
    |> Steps.fill_out_login_form(@account_info)
    |> Steps.submit_login_form()
    |> Steps.assert_on_the_company_home_page()
  end

  feature "login with incorrect email", ctx do
    ctx
    |> Steps.given_i_have_an_account(@account_info)
    |> Steps.open_operately()
    |> Steps.assert_on_the_login_page()
    |> Steps.fill_out_login_form(%{email: "non-existing@email.com", password: @account_info[:password]})
    |> Steps.submit_login_form()
    |> Steps.assert_invalid_email_error()
  end

  feature "login with incorrect password", ctx do
    ctx
    |> Steps.given_i_have_an_account(@account_info)
    |> Steps.open_operately()
    |> Steps.assert_on_the_login_page()
    |> Steps.fill_out_login_form(%{email: @account_info[:email], password: "incorrect-password"})
    |> Steps.submit_login_form()
    |> Steps.assert_wrong_password_error()
  end

  feature "reset password", ctx do
    ctx
    |> Steps.given_im_logged_in(@account_info)
    |> Steps.navigate_to_password_reset_page()
    |> Steps.fill_in_reset_password_form(@account_info)
    |> Steps.submit_reset_password_form()
    |> Steps.assert_password_changed()
  end

  feature "redirect after login to the page I was trying to access", ctx do
    ctx
    |> Steps.given_i_have_an_account(@account_info)
    |> Steps.visit_a_protected_page()
    |> Steps.assert_i_am_redirected_to_login_page()
    |> Steps.fill_out_login_form(@account_info)
    |> Steps.submit_login_form()
    |> Steps.assert_on_the_protected_page()
  end

end
