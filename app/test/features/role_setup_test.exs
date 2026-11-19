defmodule Operately.Features.RoleSetupTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.RoleSetupSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "saving a role preserves the destination and persists after reload", ctx do
    ctx
    |> Steps.visit_profile()
    |> Steps.assert_prompt_visible()
    |> Steps.save_role()
    |> Steps.assert_setup_complete("Designer")
    |> Steps.visit_profile()
    |> Steps.assert_prompt_absent()
  end

  feature "skipping persists without setting a title", ctx do
    ctx
    |> Steps.use_narrow_window()
    |> Steps.visit_profile()
    |> Steps.assert_prompt_visible()
    |> Steps.skip_role()
    |> Steps.assert_setup_complete(nil)
    |> Steps.visit_profile()
    |> Steps.assert_prompt_absent()
  end
end
