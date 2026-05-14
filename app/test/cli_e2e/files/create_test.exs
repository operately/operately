defmodule Operately.CliE2E.Files.CreateTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Files.CreateSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "files create uploads a file with external defaults", ctx do
    ctx
    |> Steps.create_file_with_defaults()
    |> Steps.assert_file_created_successfully()
    |> Steps.assert_defaults_were_applied()
  end

  test "files create applies explicit overrides", ctx do
    ctx
    |> Steps.create_file_with_overrides()
    |> Steps.assert_file_created_successfully()
    |> Steps.assert_overrides_were_applied()
  end
end
