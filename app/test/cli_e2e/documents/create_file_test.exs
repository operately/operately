defmodule Operately.CliE2E.Documents.CreateFileTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Documents.CreateFileSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "documents create_file uploads a file by project_id", ctx do
    ctx
    |> Steps.setup_project()
    |> Steps.create_file_for_parent()
    |> Steps.assert_file_created_successfully()
    |> Steps.assert_defaults_were_applied()
  end

  test "documents create_file uploads a file by goal_id", ctx do
    ctx
    |> Steps.setup_goal()
    |> Steps.create_file_for_parent()
    |> Steps.assert_file_created_successfully()
    |> Steps.assert_defaults_were_applied()
  end

  test "documents create_file uploads a file with external defaults", ctx do
    ctx
    |> Steps.create_file_with_defaults()
    |> Steps.assert_file_created_successfully()
    |> Steps.assert_defaults_were_applied()
  end

  test "documents create_file applies explicit overrides", ctx do
    ctx
    |> Steps.create_file_with_overrides()
    |> Steps.assert_file_created_successfully()
    |> Steps.assert_overrides_were_applied()
  end
end
