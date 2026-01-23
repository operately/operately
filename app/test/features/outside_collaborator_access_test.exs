defmodule Operately.Features.OutsideCollaboratorAccessTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.OutsideCollaboratorAccessSteps, as: Steps

  describe "project access for outside collaborators" do
    setup ctx do
      Steps.setup_project_with_parent_goal(ctx)
    end

    feature "outside collaborator gets 404 on project page without explicit access", ctx do
      ctx
      |> Steps.assert_only_company_member_has_edit_access_to_project()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_project_page()
      |> Steps.assert_404_page()
    end

    feature "outside collaborator can see project page after being granted explicit access", ctx do
      ctx
      |> Steps.assert_only_company_member_has_edit_access_to_project()
      |> Steps.give_collaborator_project_access()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_project_page()
      |> Steps.assert_project_page_visible()
      |> Steps.assert_parent_goal_not_visible()
      |> Steps.assert_move_space_option_not_visible()
      |> Steps.assert_space_not_in_navigation()
    end

    feature "outside collaborator gets 404 on parent goal page even with project access", ctx do
      ctx
      |> Steps.assert_only_company_member_has_edit_access_to_parent_goal()
      |> Steps.give_collaborator_project_access()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_parent_goal_page()
      |> Steps.assert_404_page()
    end

    feature "outside collaborator gets 404 on space page even with project access", ctx do
      ctx
      |> Steps.assert_only_company_member_has_edit_access_to_space()
      |> Steps.give_collaborator_project_access()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_space_page()
      |> Steps.assert_404_page()
    end
  end

  describe "goal access for outside collaborators" do
    setup ctx do
      Steps.setup_goal_with_parent_goal(ctx)
    end

    feature "outside collaborator gets 404 on goal page without explicit access", ctx do
      ctx
      |> Steps.assert_only_company_member_has_edit_access_to_goal()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_goal_page()
      |> Steps.assert_404_page()
    end

    feature "outside collaborator can see goal page after being granted explicit access", ctx do
      ctx
      |> Steps.assert_only_company_member_has_edit_access_to_goal()
      |> Steps.give_collaborator_goal_access()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_goal_page()
      |> Steps.assert_goal_page_visible()
      |> Steps.assert_parent_goal_not_visible()
      |> Steps.assert_move_space_option_not_visible()
      |> Steps.assert_space_not_in_navigation()
    end

    feature "outside collaborator gets 404 on parent goal page even with goal access", ctx do
      ctx
      |> Steps.assert_only_company_member_has_edit_access_to_parent_goal()
      |> Steps.give_collaborator_goal_access()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_parent_goal_page()
      |> Steps.assert_404_page()
    end

    feature "outside collaborator gets 404 on space page even with goal access", ctx do
      ctx
      |> Steps.assert_only_company_member_has_edit_access_to_space()
      |> Steps.give_collaborator_goal_access()
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_space_page()
      |> Steps.assert_404_page()
    end
  end
end
