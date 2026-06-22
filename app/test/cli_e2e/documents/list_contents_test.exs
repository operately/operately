defmodule Operately.CliE2E.Documents.ListContentsTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Documents.ListContentsSteps, as: Steps

  test "documents list_contents works by space_id", ctx do
    ctx
    |> Steps.setup()
    |> Steps.list_contents_for_parent()
    |> Steps.assert_seeded_document_listed()
  end

  test "documents list_contents works by project_id", ctx do
    ctx
    |> Steps.setup_project()
    |> Steps.list_contents_for_parent()
    |> Steps.assert_seeded_document_listed()
  end

  test "documents list_contents works by goal_id", ctx do
    ctx
    |> Steps.setup_goal()
    |> Steps.list_contents_for_parent()
    |> Steps.assert_seeded_document_listed()
  end

  test "documents list_contents lists only folder children", ctx do
    ctx
    |> Steps.setup()
    |> Steps.create_folder_and_nested_document()
    |> Steps.list_folder_contents()
    |> Steps.assert_only_nested_document_listed()
  end
end
