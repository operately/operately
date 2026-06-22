defmodule Operately.CliE2E.Documents.CreateFolderTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Documents.CreateFolderSteps, as: Steps

  test "documents create_folder works by space_id", ctx do
    ctx
    |> Steps.setup()
    |> Steps.create_folder_for_parent()
    |> Steps.assert_folder_created_successfully()
  end

  test "documents create_folder works by project_id", ctx do
    ctx
    |> Steps.setup_project()
    |> Steps.create_folder_for_parent()
    |> Steps.assert_folder_created_successfully()
  end

  test "documents create_folder works by goal_id", ctx do
    ctx
    |> Steps.setup_goal()
    |> Steps.create_folder_for_parent()
    |> Steps.assert_folder_created_successfully()
  end
end
