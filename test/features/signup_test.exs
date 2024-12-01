defmodule Operately.Features.SignupTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.SignupSteps, as: Steps

  setup ctx, do: Factory.setup(ctx)

  feature "signup with valid email", ctx do
    ctx
    |> Steps.visit_signup_page()
    |> Steps.enter_email()
    |> Steps.click_continue_button()
    |> Steps.fill_in_activation_code_from_email()
    |> Steps.enter_name_and_password()
  end
end
