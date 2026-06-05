defmodule Operately.Features.ProjectContributors.EditingAndPageTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectContributorsCase

  describe "editing project contributors" do
    @tag login_as: :champion
    feature "full access", ctx do
      ctx
      |> Steps.given_the_project_has_contributor(name: "Michael Scott")
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.visit_project_contributors_page()
      |> Steps.assert_contributor_attributes(name: "Michael Scott", responsibility: "Lead the backend implementation", access: "Edit Access")
      |> Steps.start_editing_contributor(name: "Michael Scott")
      |> Steps.edit_contributor(responsibility: "New responsibility", access: "Full Access")
      |> Steps.assert_contributor_attributes(name: "Michael Scott", responsibility: "New responsibility", access: "Full Access")
    end

    @tag login_as: :champion
    feature "User with full access can edit another user with full access", ctx do
      ctx
      |> Steps.given_the_project_has_contributor(name: "Michael Scott", access: Binding.full_access())
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.visit_project_contributors_page()
      |> Steps.assert_contributor_attributes(name: "Michael Scott", responsibility: "Lead the backend implementation", access: "Full Access")
      |> Steps.start_editing_contributor(name: "Michael Scott")
      |> Steps.edit_contributor(responsibility: "New responsibility", access: "View Access")
      |> Steps.assert_contributor_attributes(name: "Michael Scott", responsibility: "New responsibility", access: "View Access")
    end

    @tag login_as: :contributor
    feature "edit access", ctx do
      ctx
      |> Steps.given_the_project_has_contributor(name: "Michael Scott", access: Binding.view_access())
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_contributors_page()
      |> Steps.assert_contributor_attributes(name: "Michael Scott", responsibility: "Lead the backend implementation", access: "View Access")
      |> Steps.start_editing_contributor(name: "Michael Scott")
      |> Steps.edit_contributor(responsibility: "New responsibility", access: "Edit Access")
      |> Steps.assert_contributor_attributes(name: "Michael Scott", responsibility: "New responsibility", access: "Edit Access")
    end

    @tag login_as: :contributor
    feature "User with edit access cannot edit another user with edit access", ctx do
      ctx
      |> Steps.given_the_project_has_contributor(name: "Michael Scott", access: Binding.edit_access())
      |> Steps.given_the_project_has_contributor(name: "Dwight Schrute", access: Binding.full_access())
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_contributors_page()
      |> Steps.assert_contributor_attributes(name: "Michael Scott", responsibility: "Lead the backend implementation", access: "Edit Access")
      |> Steps.assert_contributor_attributes(name: "Dwight Schrute", responsibility: "Lead the backend implementation", access: "Full Access")
      |> Steps.assert_can_edit_user(name: "Michael Scott")
      |> Steps.assert_cannot_edit_user(name: "Dwight Schrute")
    end
  end

  describe "contributors page" do
    @tag login_as: :contributor
    feature "listing all other people who can access the project", ctx do
      ctx
      |> Steps.given_company_members_have_access()
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_contributors_page()
      |> Steps.expand_show_other_people()
      |> Steps.assert_other_people_listed()
    end

    @tag login_as: :commenter
    feature "user with comment-access gets 404", ctx do
      ctx
      |> Steps.given_company_members_have_access()
      |> Steps.assert_logged_in_contributor_has_comment_access()
      |> Steps.visit_project_contributors_page(:direct)
      |> Steps.assert_404()
    end
  end
end
