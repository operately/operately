defmodule Operately.Features.Projects.DocsAndFilesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps, as: Steps

  setup ctx do
    ctx
    |> Steps.create_project(name: "Apollo")
    |> Steps.setup_contributors()
    |> Steps.login()
    |> Steps.given_project_docs_and_files_exist()
  end

  @tag login_as: :champion
  feature "project overview shows the docs and files preview", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.assert_project_docs_and_files_preview_visible(name: "Project Brief")
  end

  @tag login_as: :champion
  feature "project-backed documents link back to the project tab", ctx do
    ctx
    |> Steps.open_project_docs_and_files()
    |> Steps.assert_project_docs_and_files_node_visible(name: "Project Brief")
    |> Steps.open_project_docs_and_files_node(name: "Project Brief")
    |> Steps.assert_project_document_page_open()
    |> Steps.navigate_back_to_project_docs_and_files()
  end

  @tag login_as: :champion
  feature "project-backed files link back to the project tab", ctx do
    ctx
    |> Steps.open_project_docs_and_files()
    |> Steps.assert_project_docs_and_files_node_visible(name: "Project Checklist")
    |> Steps.open_project_docs_and_files_node(name: "Project Checklist")
    |> Steps.assert_project_file_page_open()
    |> Steps.navigate_back_to_project_docs_and_files()
  end

  @tag login_as: :champion
  feature "project-backed links link back to the project tab", ctx do
    ctx
    |> Steps.open_project_docs_and_files()
    |> Steps.assert_project_docs_and_files_node_visible(name: "Project Tracker")
    |> Steps.open_project_docs_and_files_node(name: "Project Tracker")
    |> Steps.assert_project_link_page_open()
    |> Steps.navigate_back_to_project_docs_and_files()
  end

  @tag login_as: :champion
  feature "project-backed folders link back to the project tab", ctx do
    ctx
    |> Steps.open_project_docs_and_files()
    |> Steps.assert_project_docs_and_files_node_visible(name: "Project Folder")
    |> Steps.open_project_docs_and_files_node(name: "Project Folder")
    |> Steps.assert_project_folder_page_open()
    |> Steps.navigate_back_to_project_docs_and_files()
  end
end
