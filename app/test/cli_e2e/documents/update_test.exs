defmodule Operately.CliE2E.Documents.UpdateTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Documents.UpdateSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "documents update_document updates the document", ctx do
    ctx
    |> Steps.update_document()
    |> Steps.assert_document_updated()
  end

  test "documents update_file updates the file", ctx do
    ctx
    |> Steps.update_file()
    |> Steps.assert_file_updated()
  end

  test "documents update_link updates the link", ctx do
    ctx
    |> Steps.update_link()
    |> Steps.assert_link_updated()
  end

  test "documents rename_folder renames the folder", ctx do
    ctx
    |> Steps.rename_folder()
    |> Steps.assert_folder_renamed()
  end
end
