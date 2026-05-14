defmodule Operately.CliE2E.Goals.CreateCheckInTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Goals.CreateCheckInSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "goals create_check_in uses the external defaults when optional flags are omitted", ctx do
    ctx
    |> Steps.create_check_in_with_defaults()
    |> Steps.assert_check_in_created_successfully()
    |> Steps.assert_defaults_were_applied()
  end

  test "goals create_check_in uses explicit flags instead of the defaults", ctx do
    ctx
    |> Steps.create_check_in_with_overrides()
    |> Steps.assert_check_in_created_successfully()
    |> Steps.assert_overrides_were_applied()
  end
end
