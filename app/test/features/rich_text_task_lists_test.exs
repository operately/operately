defmodule Operately.Features.RichTextTaskListsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.RichTextTaskListsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "create a document with task items from the toolbar", ctx do
    ctx
    |> Steps.visit_new_document()
    |> Steps.create_task_list_from_toolbar()
    |> Steps.assert_created_task_list()
  end

  feature "document checkboxes persist and create one version", ctx do
    ctx
    |> Steps.visit_document()
    |> Steps.toggle_and_reload("Document item")
    |> Steps.assert_document_version()
  end

  feature "description and comment checkboxes persist", ctx do
    ctx
    |> Steps.visit_project()
    |> Steps.toggle_and_reload("Project item")
    |> Steps.visit_document()
    |> Steps.toggle_and_reload("Comment item")
  end

  feature "viewers cannot change checkboxes", ctx do
    ctx
    |> Steps.login_as_viewer()
    |> Steps.visit_document()
    |> Steps.assert_disabled("Document item")
    |> Steps.visit_project()
    |> Steps.assert_disabled("Project item")
  end

  feature "conflicting changes refresh content without overwriting it", ctx do
    ctx
    |> Steps.visit_document()
    |> Steps.change_document_concurrently()
    |> Steps.toggle_stale_document()
    |> Steps.assert_concurrent_content_preserved()
  end
end
