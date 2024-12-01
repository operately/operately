defmodule Operately.Support.Features.SignupSteps do
  use Operately.FeatureCase
  alias Operately.Support.Features.UI.Emails, as: Emails

  @email "michael@test.email"

  step :visit_signup_page, ctx do
    ctx |> UI.visit("/sign_up")
  end

  step :enter_email, ctx do
    ctx |> UI.fill(testid: "email", with: @email)
  end

  step :click_continue_button, ctx do
    ctx |> UI.click(testid: "submit")
  end

  step :fill_in_activation_code_from_email, ctx do
    emails = Emails.wait_for_email_for(@email, attempts: 10)
    subject = hd(emails).subject
    code = String.split(subject, ": ") |> List.last()

    ctx |> UI.fill(testid: "code", with: code)
  end

end
