defmodule Operately.CliE2E.Documents.DeleteTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Documents.DeleteSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "documents delete_document deletes the document", ctx do
    ctx
    |> Steps.create_document()
    |> Steps.delete_document()
    |> Steps.assert_document_deleted()
  end

  test "documents delete_file deletes the file", ctx do
    ctx
    |> Steps.create_file()
    |> Steps.delete_file()
    |> Steps.assert_file_deleted()
  end

  test "documents delete_link deletes the link", ctx do
    ctx
    |> Steps.create_link()
    |> Steps.delete_link()
    |> Steps.assert_link_deleted()
  end

  test "documents delete_folder deletes the folder", ctx do
    ctx
    |> Steps.create_folder()
    |> Steps.delete_folder()
    |> Steps.assert_folder_deleted()
  end
end
