defmodule Operately.Features.OutsideCollaborator.DirectoryTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.OutsideCollaboratorAccessSteps, as: Steps

  describe "space creation for outside collaborators" do
    setup ctx do
      Steps.setup_outside_collaborator(ctx)
    end

    feature "outside collaborator does not see Add Space button on homepage", ctx do
      ctx
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_home_page()
      |> Steps.assert_add_space_button_not_visible()
    end

    feature "outside collaborator gets error when manually submitting space creation form", ctx do
      ctx
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_new_space_page()
      |> Steps.fill_space_form(%{name: "Test Space", mission: "Test Mission"})
      |> Steps.submit_space_form()
      |> Steps.assert_permission_error_message()
    end
  end

  describe "people directory access for outside collaborators" do
    setup ctx do
      Steps.setup_outside_collaborator(ctx)
    end

    feature "outside collaborator does not see people links in the company dropdown", ctx do
      ctx
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_home_page()
      |> Steps.open_company_dropdown()
      |> Steps.assert_people_link_not_visible_in_company_dropdown()
      |> Steps.assert_org_chart_link_not_visible_in_company_dropdown()
    end

    feature "outside collaborator can access people page but sees no people", ctx do
      ctx
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_people_page()
      |> Steps.assert_people_page_loads_with_no_people()
    end

    feature "outside collaborator can access org chart page but sees no people", ctx do
      ctx
      |> Steps.log_in_as_collaborator()
      |> Steps.visit_org_chart_page()
      |> Steps.assert_org_chart_page_loads_with_no_people()
    end
  end
end
