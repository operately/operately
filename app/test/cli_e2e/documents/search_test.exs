defmodule Operately.CliE2E.Documents.SearchTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Documents.SearchSteps, as: Steps

  test "documents search finds indexed content by space_id", ctx do
    ctx
    |> Steps.setup()
    |> Steps.search()
    |> Steps.assert_document_found()
  end

  test "documents search finds indexed content by project_id", ctx do
    ctx
    |> Steps.setup_project()
    |> Steps.search()
    |> Steps.assert_document_found()
  end

  test "documents search finds indexed content by goal_id", ctx do
    ctx
    |> Steps.setup_goal()
    |> Steps.search()
    |> Steps.assert_document_found()
  end
end
