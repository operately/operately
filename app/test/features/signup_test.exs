defmodule Operately.Features.SignupTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.SignupSteps, as: Steps

  set_app_config(:allow_signup_with_email, true)
  set_app_config(:allow_login_with_email, true)

  setup ctx, do: Factory.setup(ctx)

  feature "resend an expired signup code without restarting signup", ctx do
    ctx
    |> Steps.visit_signup_page()
    |> Steps.choose_signup_with_email()
    |> Steps.use_resend_email()
    |> Steps.fill_in_details()
    |> Steps.expire_original_activation_code()
    |> Steps.resend_activation_code()
    |> Steps.fill_in_new_activation_code_from_email()
    |> Steps.assert_signup_successful()
  end

  feature "signup with valid email", ctx do
    ctx
    |> Steps.visit_signup_page()
    |> Steps.choose_signup_with_email()
    |> Steps.fill_in_details()
    |> Steps.fill_in_activation_code_from_email()
    |> Steps.assert_signup_successful()
  end

  feature "oversized email can be corrected without losing signup details", ctx do
    ctx
    |> Steps.visit_signup_page()
    |> Steps.choose_signup_with_email()
    |> Steps.submit_oversized_email()
    |> Steps.assert_oversized_email_rejected_inline()
    |> Steps.correct_oversized_email()
    |> Steps.fill_in_activation_code_from_email()
    |> Steps.assert_signup_successful()
  end

  feature "email taken after delivery returns to details and permits correction", ctx do
    ctx
    |> Steps.visit_signup_page()
    |> Steps.choose_signup_with_email()
    |> Steps.fill_in_details()
    |> Steps.register_email_elsewhere()
    |> Steps.fill_in_activation_code_from_email()
    |> Steps.assert_final_email_error()
    |> Steps.correct_oversized_email()
    |> Steps.fill_in_activation_code_from_email()
    |> Steps.assert_signup_successful()
  end
end
