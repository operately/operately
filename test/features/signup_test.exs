defmodule Operately.Features.SignupTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.SignupSteps, as: Steps

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
