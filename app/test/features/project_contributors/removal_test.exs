defmodule Operately.Features.ProjectContributors.RemovalTest do
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
end
