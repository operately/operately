defmodule Operately.Features.SignupTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.SignupSteps, as: Steps

  set_app_config(:allow_signup_with_email, true)
  set_app_config(:allow_login_with_email, true)

  setup ctx, do: Factory.setup(ctx)

  feature "signup with valid email", ctx do
    ctx
    |> Steps.visit_signup_page()
    |> Steps.choose_signup_with_email()
    |> Steps.fill_in_details()
    |> Steps.fill_in_activation_code_from_email()
    |> Steps.assert_signup_successful()
  end
end
