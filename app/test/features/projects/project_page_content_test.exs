defmodule Operately.Features.Projects.ProjectPageContentTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.Projects.ProjectPageContentSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "overview loads while content requests are pending and tabs show skeletons", ctx do
    ctx
    |> Steps.visit_work_map()
    |> Steps.pause_content_requests()
    |> Steps.open_project()
    |> Steps.assert_overview_loaded()
    |> Steps.assert_content_requests(["check-ins", "discussions", "tasks", "docs-hub", "docs-and-files"])
    |> Steps.open_tab("docs-and-files")
    |> Steps.assert_skeleton("docs-and-files")
    |> Steps.release_content("docs-hub")
    |> Steps.assert_skeleton("docs-and-files")
    |> Steps.release_content("docs-and-files")
    |> Steps.assert_content_loaded("docs-and-files")
    |> Steps.open_tab("tasks")
    |> Steps.assert_skeleton("tasks")
    |> Steps.release_content("tasks")
    |> Steps.assert_content_loaded("tasks")
    |> Steps.open_tab("discussions")
    |> Steps.assert_skeleton("discussions")
    |> Steps.open_tab("check-ins")
    |> Steps.assert_skeleton("check-ins")
    |> Steps.release_content("check-ins")
    |> Steps.assert_content_loaded("check-ins")
    |> Steps.release_content("discussions")
    |> Steps.open_tab("discussions")
    |> Steps.assert_content_loaded("discussions")
    |> Steps.assert_content_requests(["check-ins", "discussions", "tasks", "docs-hub", "docs-and-files"])
  end

  feature "navigating from a task to check-ins waits for that list", ctx do
    ctx
    |> Steps.visit_task()
    |> Steps.pause_content_requests()
    |> Steps.open_tab("check-ins")
    |> Steps.assert_content_requests(["check-ins"])
    |> Steps.assert_still_on_task()
    |> Steps.release_content("check-ins")
    |> Steps.assert_content_loaded("check-ins")
    |> Steps.assert_content_requests(["check-ins", "discussions", "tasks", "docs-hub", "docs-and-files"])
  end

  feature "navigating from a task to discussions waits for that list", ctx do
    ctx
    |> Steps.visit_task()
    |> Steps.pause_content_requests()
    |> Steps.open_tab("discussions")
    |> Steps.assert_content_requests(["discussions"])
    |> Steps.assert_still_on_task()
    |> Steps.release_content("discussions")
    |> Steps.assert_content_loaded("discussions")
    |> Steps.assert_content_requests(["check-ins", "discussions", "tasks", "docs-hub", "docs-and-files"])
  end

  feature "navigating from a task to the tasks tab waits for the task list", ctx do
    ctx
    |> Steps.visit_task()
    |> Steps.pause_content_requests()
    |> Steps.open_tab("tasks")
    |> Steps.assert_content_requests(["tasks"])
    |> Steps.assert_still_on_task()
    |> Steps.release_content("tasks")
    |> Steps.assert_content_loaded("tasks")
    |> Steps.assert_content_requests(["check-ins", "discussions", "tasks", "docs-hub", "docs-and-files"])
  end

  feature "navigating directly to docs and files waits for both queries", ctx do
    ctx
    |> Steps.visit_task()
    |> Steps.pause_content_requests()
    |> Steps.open_tab("docs-and-files")
    |> Steps.assert_content_requests(["docs-hub", "docs-and-files"])
    |> Steps.assert_still_on_task()
    |> Steps.release_content("docs-hub")
    |> Steps.assert_still_on_task()
    |> Steps.release_content("docs-and-files")
    |> Steps.assert_content_loaded("docs-and-files")
    |> Steps.assert_content_requests(["check-ins", "discussions", "tasks", "docs-hub", "docs-and-files"])
  end

  feature "a new document appears when returning to a cached project tab", ctx do
    ctx
    |> Steps.visit_work_map()
    |> Steps.open_project()
    |> Steps.assert_overview_loaded()
    |> Steps.open_tab("docs-and-files")
    |> Steps.assert_content_loaded("docs-and-files")
    |> Steps.create_document_and_return_to_project("New project document")
  end

  feature "uploaded files persist after returning to the project tab", ctx do
    ctx
    |> Steps.visit_work_map()
    |> Steps.open_project()
    |> Steps.assert_overview_loaded()
    |> Steps.open_tab("docs-and-files")
    |> Steps.assert_content_loaded("docs-and-files")
    |> Steps.upload_project_file()
    |> Steps.visit_work_map()
    |> Steps.open_project()
    |> Steps.open_tab("docs-and-files")
    |> Steps.assert_uploaded_project_file()
  end
end
