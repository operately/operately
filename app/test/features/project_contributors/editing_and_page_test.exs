defmodule Operately.Features.ProjectContributors.EditingAndPageTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectContributorsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "editing project contributors" do
    @tag login_as: :champion
    feature "full access", ctx do
      ctx
      |> Steps.given_the_project_has_contributor(name: "Michael Scott")
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.visit_project_page()
      |> Steps.assert_contributor_attributes(name: "Michael Scott", responsibility: "Lead the backend implementation", access: "Edit Access")
      |> Steps.start_editing_contributor(name: "Michael Scott")
      |> Steps.edit_contributor(responsibility: "New responsibility", access: "Full Access")
      |> Steps.assert_contributor_attributes(name: "Michael Scott", responsibility: "New responsibility", access: "Full Access")
    end
  end

  describe "other people with access" do
    @tag login_as: :contributor
    feature "listing people who inherit access through company or space membership", ctx do
      ctx
      |> Steps.given_company_members_have_access()
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.open_other_people_with_access()
      |> Steps.assert_other_people_listed()
    end
  end

  describe "privacy" do
    @tag login_as: :champion
    feature "champion can change company access from the overview sidebar", ctx do
      ctx
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.visit_project_page()
      |> Steps.change_company_access_to_no_access()
      |> Steps.assert_company_access_is_no_access()
    end
  end
end
