defmodule Operately.Features.ProjectContributors.RoleAssignmentsTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectContributorsCase

  describe "adding project contributors" do
    setup ctx do
      ctx
      |> Steps.given_a_person_exists(name: "Michael Scott")
      |> Steps.given_a_person_exists(name: "Dwight Schrute")
      |> Steps.given_a_person_exists(name: "Jim Halpert")
    end

    @tag login_as: :champion
    feature "add a new champion", ctx do
      ctx
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.visit_project_contributors_page()
      |> Steps.choose_new_champion(name: "Michael Scottish")
      |> Steps.assert_new_champion_is(name: "Michael Scottish")
      |> Steps.assert_old_champion_is_contributor()
      |> Steps.assert_new_champion_chosen_feed_item_exists(name: "Michael")
    end

    @tag login_as: :contributor
    feature "user with edit-access cannot add a new champion", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_contributors_page()
      |> Steps.assert_cannot_edit_champion()
    end

    @tag login_as: :champion
    feature "add a new reviewer", ctx do
      ctx
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.visit_project_contributors_page()
      |> Steps.choose_new_reviewer(name: "Michael Scottish")
      |> Steps.assert_new_reviewer_is(name: "Michael Scottish")
      |> Steps.assert_old_reviewer_is_contributor()
      |> Steps.assert_new_reviewer_chosen_feed_item_exists(name: "Michael")
    end

    @tag login_as: :contributor
    feature "user with edit-access cannot add a new reviewer", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_contributors_page()
      |> Steps.assert_cannot_edit_reviewer()
    end

    @tag login_as: :contributor
    feature "user with edit-access doesn't see add-champion button and message", ctx do
      ctx
      |> Steps.given_project_doesnt_have_champion()
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_contributors_page()
      |> Steps.assert_cannot_add_champion()
    end

    @tag login_as: :contributor
    feature "user with edit-access doesn't see add-reviewer button and message", ctx do
      ctx
      |> Steps.given_project_doesnt_have_reviewer()
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_contributors_page()
      |> Steps.assert_cannot_add_reviewer()
    end
  end
end
