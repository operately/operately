defmodule Operately.CliE2E.Spaces.UpdateToolsTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Spaces.UpdateToolsSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "spaces update_tools can enable templates without overwriting other tools", ctx do
    ctx
    |> Steps.disable_templates()
    |> Steps.update_templates_enabled_via_cli()
    |> Steps.assert_cli_succeeded()
    |> Steps.assert_only_templates_changed()
  end
end
