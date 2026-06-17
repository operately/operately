defmodule Operately.CliE2E.Links.CreateTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Links.CreateSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "documents create_link uses the external defaults when optional flags are omitted", ctx do
    ctx
    |> Steps.create_link_with_defaults()
    |> Steps.assert_link_created_successfully()
    |> Steps.assert_defaults_were_applied()
  end

  test "documents create_link uses explicit flags instead of the defaults", ctx do
    ctx
    |> Steps.create_link_with_overrides()
    |> Steps.assert_link_created_successfully()
    |> Steps.assert_overrides_were_applied()
  end
end
