defmodule Operately.Features.Projects.PreloadAccessTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectsCase

  describe "project page preload access" do
    setup ctx do
      ctx = Steps.create_project(ctx, name: "Test Project")
      ctx = Steps.login(ctx)

      {:ok, ctx}
    end

    @tag login_as: :reviewer
    feature "project page hides parent goal when viewer cannot access it", ctx do
      ctx
      |> Steps.given_a_goal_exists(name: "Hidden Goal")
      |> Steps.given_the_goal_is_connected_with_project()
      |> Steps.assert_project_has_parent_goal()
      |> Steps.given_goal_is_not_accessible_to_company_members()
      |> Steps.given_space_member_exists()
      |> Steps.login_as_space_member()
      |> Steps.visit_project_page()
      |> Steps.assert_project_page_loaded()
      |> Steps.assert_parent_goal_field_not_rendered()
    end

    @tag login_as: :reviewer
    feature "project page hides space navigation when space is not accessible", ctx do
      ctx
      |> Steps.given_company_members_cannot_access_space()
      |> Steps.visit_project_page()
      |> Steps.assert_project_navigation_without_space()
      |> Steps.assert_move_to_another_space_is_hidden()
    end
  end
end
