defmodule Operately.Support.Features.SessionTestSteps do
  use Operately.FeatureCase

  step :given_i_have_an_account, ctx, account_info do
    Factory.add_company_member(ctx, :member, email: account_info[:email], password: account_info[:password])  
  end

  step :given_im_logged_in, ctx, account_info do
    ctx
    |> Factory.add_company_member(:member, email: account_info[:email], password: account_info[:password])  
    |> Factory.log_in_person(:member)
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

  step :navigate_to_password_reset_page, ctx do
    ctx 
    |> UI.click(testid: "account-menu")
    |> UI.click(testid: "password-link")
    |> UI.click(testid: "change-password")
    |> UI.assert_has(testid: "change-password-page")
  end

  step :fill_in_reset_password_form, ctx, account_info do
    ctx 
    |> UI.fill(testid: "currentPassword", with: account_info[:password])
    |> UI.fill(testid: "newPassword", with: "new-password-123")
    |> UI.fill(testid: "confirmPassword", with: "new-password-123")
  end

  step :submit_reset_password_form, ctx do
    ctx 
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "account-security-page")
  end

  step :assert_password_changed, ctx do
    account = Operately.People.get_account!(ctx.member.account_id)
    assert Operately.People.Account.valid_password?(account, "new-password-123")

    ctx
  end

  step :visit_a_protected_page, ctx do
    ctx 
    |> UI.visit(Paths.goals_path(ctx.company))
  end

  step :assert_i_am_redirected_to_login_page, ctx do
    ctx |> UI.click(testid: "login-page")
  end

  step :assert_on_the_protected_page, ctx do
    ctx |> UI.click(testid: "goals-and-projects-page")
  end

end
