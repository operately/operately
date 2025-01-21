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

  step :click_forgot_password_link, ctx do
    ctx |> UI.click(testid: "forgot-password-link")
  end

  step :fill_out_forgot_password_form_and_submit, ctx, account_info do
    ctx 
    |> UI.fill(testid: "email", with: account_info[:email]) 
    |> UI.click(testid: "submit")
    |> UI.assert_text("Password reset instructions have been sent to your email.")
  end

  step :open_password_reset_link_from_email, ctx do
    email = UI.Emails.last_sent_email()
    link = UI.Emails.find_link(email, "Reset password")

    ctx
    |> UI.visit(link)
  end

  step :fill_out_reset_password_form, ctx, account_info do
    ctx 
    |> UI.fill(testid: "email", with: account_info[:email])
    |> UI.fill(testid: "password", with: "new-password-123")
    |> UI.fill(testid: "password-confirmation", with: "new-password-123")
    |> UI.click(testid: "submit")
  end

  step :assert_password_changed, ctx do
    account = Operately.People.get_account!(ctx.member.account_id)
    assert Operately.People.Account.valid_password?(account, "new-password-123")

    ctx
  end

end
