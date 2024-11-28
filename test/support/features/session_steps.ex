defmodule Operately.Support.Features.SessionTestSteps do
  use Operately.FeatureCase

  step :assert_i_have_an_account, ctx, account_info do
    Factory.add_company_member(ctx, :member, email: account_info[:email], password: account_info[:password])  
  end

  step :open_operately, ctx do
    ctx |> UI.visit("/")
  end

  step :assert_on_the_login_page, ctx do
    ctx |> UI.assert_has(testid: "login-page")
  end

  step :fill_out_login_form, ctx, account_info do
    ctx
    |> UI.fill(testid: "email", with: account_info[:email])
    |> UI.fill(testid: "password", with: account_info[:password])
  end

  step :submit_login_form, ctx do
    ctx |> UI.click(testid: "submit")
  end

  step :assert_on_the_company_home_page, ctx do
    ctx |> UI.assert_has(testid: "company-home") |> UI.sleep(200)
  end

  step :assert_invalid_email_error, ctx do
    ctx |> UI.assert_text("Invalid email or password")
  end

  step :assert_wrong_password_error, ctx do
    ctx |> UI.assert_text("Invalid email or password")
  end

end
