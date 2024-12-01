defmodule Operately.Support.Features.SignupSteps do
  use Operately.FeatureCase

  step :visit_signup_page, ctx do
    ctx |> UI.visit("/sign_up")
  end

  step :enter_email, ctx do
    ctx |> UI.fill(testid: "email", with: "michael@text.email")
  end

  step :click_continue_button, ctx do
    ctx |> UI.click(testid: "submit")
  end

  step :fill_in_activation_code_from_email, ctx do
    emails = UI.list_sent_emails(ctx)

    IO.inspect(emails)
  end

end
