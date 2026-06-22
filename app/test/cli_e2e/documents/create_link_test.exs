defmodule Operately.CliE2E.Documents.CreateLinkTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Documents.CreateLinkSteps, as: Steps

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

  test "documents create_link works by project_id", ctx do
    ctx
    |> Steps.setup_project()
    |> Steps.create_link_for_parent()
    |> Steps.assert_link_created_successfully()
  end

  test "documents create_link works by goal_id", ctx do
    ctx
    |> Steps.setup_goal()
    |> Steps.create_link_for_parent()
    |> Steps.assert_link_created_successfully()
  end
end
