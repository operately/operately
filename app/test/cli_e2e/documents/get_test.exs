defmodule Operately.CliE2E.Documents.GetTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Documents.GetSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "documents get_document returns the created document", ctx do
    ctx
    |> Steps.get_document()
    |> Steps.assert_document_matches()
  end

  test "documents get_file returns the created file", ctx do
    ctx
    |> Steps.get_file()
    |> Steps.assert_file_matches()
  end

  test "documents get_link returns the created link", ctx do
    ctx
    |> Steps.get_link()
    |> Steps.assert_link_matches()
  end

  test "documents get_folder returns the created folder", ctx do
    ctx
    |> Steps.get_folder()
    |> Steps.assert_folder_matches()
  end
end
