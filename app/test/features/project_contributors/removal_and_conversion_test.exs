defmodule Operately.Features.ProjectContributors.RemovalAndConversionTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectContributorsCase

  describe "removing project contributors" do
    setup ctx do
      ctx
      |> Steps.given_the_project_has_contributor(name: "Michael Scott")
    end

    @tag login_as: :champion
    feature "full access", ctx do
      ctx
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.visit_project_contributors_page()
      |> Steps.remove_contributor(name: "Michael Scott")
      |> Steps.assert_contributor_removed(name: "Michael Scott")
      |> Steps.assert_contributor_removed_feed_item_exists(name: "Michael Scott")
    end

    @tag login_as: :champion
    feature "removing a project reviewer", ctx do
      ctx
      |> Steps.visit_project_contributors_page()
      |> Steps.remove_contributor(name: ctx.reviewer.full_name)
      |> Steps.assert_reviewer_removed()
      |> Steps.assert_contributor_removed_feed_item_exists(name: ctx.reviewer.full_name)
    end

    @tag login_as: :contributor
    feature "edit access", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_contributors_page()
      |> Steps.assert_cannot_remove_user(name: "Michael Scott")
    end
  end

  describe "converting contributors" do
    @tag login_as: :champion
    feature "reviewer to a contributor", ctx do
      params = %{name: ctx.reviewer.full_name, responsibility: "Lead the backend implementation"}

      ctx
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.visit_project_page()
      |> Steps.convert_reviewer_to_contributor(params)
      |> Steps.assert_reviewer_converted_to_contributor(params)
      |> Steps.assert_reviewer_converted_to_contributor_feed_item_exists()
    end

    @tag login_as: :contributor
    feature "user with edit-access can't turn reviewer into contributor", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_contributors_page()
      |> Steps.assert_cannot_convert_reviewer_to_contributor()
    end

    @tag login_as: :champion
    feature "champion to a contributor", ctx do
      params = %{name: ctx.champion.full_name, responsibility: "Design the user interface"}

      ctx
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.visit_project_page()
      |> Steps.convert_champion_to_contributor(params)
      |> Steps.assert_champion_converted_to_contributor(params)
      |> Steps.assert_champion_converted_to_contributor_feed_item_exists()
    end

    @tag login_as: :contributor
    feature "user with edit-access can't turn champion into contributor", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_contributors_page()
      |> Steps.assert_cannot_convert_champion_to_contributor()
    end

    @tag login_as: :champion
    feature "promote a contributor to a champion", ctx do
      ctx
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.given_a_contributor_exists(name: "Debbie Downer")
      |> Steps.visit_project_contributors_page()
      |> Steps.promote_contributor_to_champion(name: "Debbie Downer")
      |> Steps.assert_new_champion_is(name: "Debbie Downer")
      |> Steps.assert_new_champion_chosen_feed_item_exists(name: "Debbie")
    end

    @tag login_as: :contributor
    feature "user with edit-access can't promote a contributor to a champion", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.given_a_contributor_exists(name: "Debbie Downer")
      |> Steps.visit_project_contributors_page()
      |> Steps.assert_cannot_promote_contributor_to_champion(name: "Debbie Downer")
    end

    @tag login_as: :champion
    feature "promote a contributor to a reviewer", ctx do
      ctx
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.given_a_contributor_exists(name: "Debbie Downer")
      |> Steps.visit_project_contributors_page()
      |> Steps.promote_contributor_to_reviewer(name: "Debbie Downer")
      |> Steps.assert_new_reviewer_is(name: "Debbie Downer")
      |> Steps.assert_new_reviewer_chosen_feed_item_exists(name: "Debbie")
    end

    @tag login_as: :contributor
    feature "user with edit-access can't promote a contributor to a reviewer", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.given_a_contributor_exists(name: "Debbie Downer")
      |> Steps.visit_project_contributors_page()
      |> Steps.assert_cannot_promote_contributor_to_reviewer(name: "Debbie Downer")
    end
  end
end
