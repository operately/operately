defmodule Operately.Features.Goal.DocsAndFilesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @tag login_as: :champion
  feature "goal overview shows the docs and files preview", ctx do
    ctx
    |> Steps.given_goal_docs_and_files_exist()
    |> Steps.assert_logged_in_member_has_full_access()
    |> Steps.visit_goal()
    |> Steps.assert_goal_docs_and_files_preview_visible(name: "Goal Brief")
  end

  @tag login_as: :champion
  feature "goal-backed documents link back to the goal tab", ctx do
    ctx
    |> Steps.given_goal_docs_and_files_exist()
    |> Steps.assert_logged_in_member_has_full_access()
    |> Steps.open_goal_docs_and_files()
    |> Steps.assert_goal_docs_and_files_node_visible(name: "Goal Brief")
    |> Steps.open_goal_docs_and_files_node(name: "Goal Brief")
    |> Steps.assert_goal_document_page_open()
    |> Steps.assert_goal_docs_and_files_navigation_links()
    |> Steps.navigate_back_to_goal_docs_and_files()
    |> Steps.open_goal_docs_and_files_node(name: "Goal Brief")
    |> Steps.assert_goal_document_page_open()
    |> Steps.navigate_back_to_goal_overview()
  end

  @tag login_as: :champion
  feature "goal-backed files link back to the goal tab", ctx do
    ctx
    |> Steps.given_goal_docs_and_files_exist()
    |> Steps.assert_logged_in_member_has_full_access()
    |> Steps.open_goal_docs_and_files()
    |> Steps.assert_goal_docs_and_files_node_visible(name: "Goal Checklist")
    |> Steps.open_goal_docs_and_files_node(name: "Goal Checklist")
    |> Steps.assert_goal_file_page_open()
    |> Steps.assert_goal_docs_and_files_navigation_links()
    |> Steps.navigate_back_to_goal_docs_and_files()
    |> Steps.open_goal_docs_and_files_node(name: "Goal Checklist")
    |> Steps.assert_goal_file_page_open()
    |> Steps.navigate_back_to_goal_overview()
  end

  @tag login_as: :champion
  feature "goal-backed links link back to the goal tab", ctx do
    ctx
    |> Steps.given_goal_docs_and_files_exist()
    |> Steps.assert_logged_in_member_has_full_access()
    |> Steps.open_goal_docs_and_files()
    |> Steps.assert_goal_docs_and_files_node_visible(name: "Goal Tracker")
    |> Steps.open_goal_docs_and_files_node(name: "Goal Tracker")
    |> Steps.assert_goal_link_page_open()
    |> Steps.assert_goal_docs_and_files_navigation_links()
    |> Steps.navigate_back_to_goal_docs_and_files()
    |> Steps.open_goal_docs_and_files_node(name: "Goal Tracker")
    |> Steps.assert_goal_link_page_open()
    |> Steps.navigate_back_to_goal_overview()
  end

  @tag login_as: :champion
  feature "goal-backed folders link back to the goal tab", ctx do
    ctx
    |> Steps.given_goal_docs_and_files_exist()
    |> Steps.assert_logged_in_member_has_full_access()
    |> Steps.open_goal_docs_and_files()
    |> Steps.assert_goal_docs_and_files_node_visible(name: "Goal Folder")
    |> Steps.open_goal_docs_and_files_node(name: "Goal Folder")
    |> Steps.assert_goal_folder_page_open()
    |> Steps.assert_goal_docs_and_files_navigation_links()
    |> Steps.navigate_back_to_goal_docs_and_files()
    |> Steps.open_goal_docs_and_files_node(name: "Goal Folder")
    |> Steps.assert_goal_folder_page_open()
    |> Steps.navigate_back_to_goal_overview()
  end
end
