defmodule Operately.Features.ProjectContributors.AccessPermissionsTest do
  use Operately.FeatureCase
  alias Operately.Access.Binding
  alias Operately.Support.Features.ProjectContributorsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "edit-access viewer" do
    @tag login_as: :contributor
    feature "can change access for contributors with edit access or less", ctx do
      ctx
      |> Steps.given_the_project_has_contributor(name: "Dwight Schrute", access: Binding.edit_access())
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.start_editing_contributor(name: "Dwight Schrute")
      |> Steps.assert_access_field_is_editable()
      |> Steps.edit_contributor(responsibility: "Sales", access: "Comment Access")
      |> Steps.assert_contributor_attributes(name: "Dwight Schrute", responsibility: "Sales", access: "Comment Access")
    end

    @tag login_as: :contributor
    feature "can remove contributors with edit access or less", ctx do
      ctx
      |> Steps.given_the_project_has_contributor(name: "Dwight Schrute", access: Binding.comment_access())
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.remove_contributor(name: "Dwight Schrute")
      |> Steps.assert_contributor_removed(name: "Dwight Schrute")
    end

    @tag login_as: :contributor
    feature "cannot change access for contributors with full access", ctx do
      ctx
      |> Steps.given_the_project_has_contributor(name: "Jan Levinson", access: Binding.full_access())
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.start_editing_contributor(name: "Jan Levinson")
      |> Steps.assert_access_field_is_readonly(label: "Full Access")
    end

    @tag login_as: :contributor
    feature "cannot remove contributors with full access", ctx do
      ctx
      |> Steps.given_the_project_has_contributor(name: "Jan Levinson", access: Binding.full_access())
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.assert_cannot_remove_user(name: "Jan Levinson")
    end
  end

  describe "full-access viewer" do
    @tag login_as: :champion
    feature "can change access for edit-access and full-access contributors", ctx do
      ctx
      |> Steps.given_the_project_has_contributor(name: "Dwight Schrute", access: Binding.edit_access())
      |> Steps.given_the_project_has_contributor(name: "Jan Levinson", access: Binding.full_access())
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.visit_project_page()
      |> Steps.start_editing_contributor(name: "Dwight Schrute")
      |> Steps.edit_contributor(responsibility: "Assistant", access: "Comment Access")
      |> Steps.assert_contributor_attributes(name: "Dwight Schrute", responsibility: "Assistant", access: "Comment Access")
      |> Steps.start_editing_contributor(name: "Jan Levinson")
      |> Steps.assert_access_field_is_editable()
      |> Steps.edit_contributor(responsibility: "VP", access: "Edit Access")
      |> Steps.assert_contributor_attributes(name: "Jan Levinson", responsibility: "VP", access: "Edit Access")
    end

    @tag login_as: :champion
    feature "can remove edit-access and full-access contributors", ctx do
      ctx
      |> Steps.given_the_project_has_contributor(name: "Dwight Schrute", access: Binding.edit_access())
      |> Steps.given_the_project_has_contributor(name: "Jan Levinson", access: Binding.full_access())
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.visit_project_page()
      |> Steps.remove_contributor(name: "Dwight Schrute")
      |> Steps.assert_contributor_removed(name: "Dwight Schrute")
      |> Steps.remove_contributor(name: "Jan Levinson")
      |> Steps.assert_contributor_removed(name: "Jan Levinson")
    end
  end
end
