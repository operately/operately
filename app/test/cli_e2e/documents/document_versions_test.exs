defmodule Operately.CliE2E.Documents.DocumentVersionsTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Documents.DocumentVersionsSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "documents version commands list, fetch, and restore history", ctx do
    ctx
    |> Steps.create_document_with_versions()
    |> Steps.list_document_versions()
    |> Steps.assert_versions_listed_newest_first()
    |> Steps.get_first_version()
    |> Steps.assert_first_version_content()
    |> Steps.restore_first_version()
    |> Steps.assert_document_restored_to_first_version()
  end
end
