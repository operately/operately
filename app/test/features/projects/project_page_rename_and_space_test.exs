defmodule Operately.Features.Projects.ProjectPageRenameAndSpaceTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps, as: Steps

  setup ctx do
    ctx
    |> Steps.create_project(name: "Test Project")
    |> Steps.setup_contributors()
    |> Steps.login()
  end

  @tag login_as: :contributor
  feature "rename a project", ctx do
    ctx
    |> Steps.assert_logged_in_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.rename_project(new_name: "New Name")
    |> Steps.assert_project_renamed(new_name: "New Name")
    |> Steps.assert_project_renamed_visible_on_feed()
  end

  @tag login_as: :champion
  feature "move project to a different space", ctx do
    ctx
    |> Steps.given_a_space_exists(%{name: "New Space"})
    |> Steps.visit_project_page()
    |> Steps.move_project_to_new_space()
    |> Steps.assert_project_moved_notification_sent()
    |> Steps.assert_project_moved_feed_item_exists()
  end
end
