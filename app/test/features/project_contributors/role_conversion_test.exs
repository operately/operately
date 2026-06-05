defmodule Operately.Features.ProjectContributors.RoleConversionTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectContributorsCase

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
