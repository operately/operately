defmodule Operately.CliE2E.Goals.CreateDiscussionTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Goals.CreateDiscussionSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "goals create_discussion uses the external defaults when optional flags are omitted", ctx do
    ctx
    |> Steps.create_discussion_with_defaults()
    |> Steps.assert_discussion_created_successfully()
    |> Steps.assert_defaults_were_applied()
  end

  test "goals create_discussion uses explicit flags instead of the defaults", ctx do
    ctx
    |> Steps.create_discussion_with_overrides()
    |> Steps.assert_discussion_created_successfully()
    |> Steps.assert_overrides_were_applied()
  end
end
