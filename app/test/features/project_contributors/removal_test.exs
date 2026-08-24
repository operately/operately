defmodule Operately.Features.ProjectContributors.RemovalTest do
  use Operately.FeatureCase
  alias Operately.Access.Binding
  alias Operately.Support.Features.ProjectContributorsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "removing project contributors" do
    @tag login_as: :champion
    feature "full access can remove contributors", ctx do
      ctx
      |> Steps.given_the_project_has_contributor(name: "Michael Scott", access: Binding.edit_access())
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.visit_project_page()
      |> Steps.remove_contributor(name: "Michael Scott")
      |> Steps.assert_contributor_removed(name: "Michael Scott")
      |> Steps.assert_contributor_removed_feed_item_exists(name: "Michael Scott")
    end

    @tag login_as: :contributor
    feature "edit access can remove lower-or-equal access contributors", ctx do
      ctx
      |> Steps.given_the_project_has_contributor(name: "Michael Scott", access: Binding.comment_access())
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.remove_contributor(name: "Michael Scott")
      |> Steps.assert_contributor_removed(name: "Michael Scott")
    end

    @tag login_as: :contributor
    feature "edit access cannot remove full-access contributors", ctx do
      ctx
      |> Steps.given_the_project_has_contributor(name: "Michael Scott", access: Binding.full_access())
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.assert_cannot_remove_user(name: "Michael Scott")
    end
  end
end
