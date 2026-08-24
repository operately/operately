defmodule Operately.Features.WorkMap.ProjectTemplatesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.WorkMapSteps, as: Steps

  describe "Work Map project templates" do
    feature "create a project from a template on the company work map empty state", ctx do
      ctx
      |> Steps.setup_work_map_project_templates()
      |> Steps.visit_company_work_map()
      |> Steps.open_zero_state_add_project()
      |> Steps.assert_work_map_template_visible()
      |> Steps.fill_work_map_item_name("Generated from general template")
      |> Steps.select_work_map_template("General launch kit")
      |> Steps.select_work_map_start_date()
      |> Steps.submit_work_map_item()
      |> Steps.assert_project_created_from_work_map_template(name: "Generated from general template", milestone: "Kickoff")
    end

    feature "create a project from a template on the space work map empty state", ctx do
      ctx
      |> Steps.setup_empty_space_work_map_with_templates()
      |> Steps.visit_space_work_map(:space)
      |> Steps.open_zero_state_add_project()
      |> Steps.assert_work_map_template_visible()
      |> Steps.fill_work_map_item_name("Generated from space template")
      |> Steps.select_work_map_template("Launch kit")
      |> Steps.select_work_map_start_date()
      |> Steps.submit_work_map_item()
      |> Steps.assert_project_created_from_work_map_template(name: "Generated from space template", milestone: "Kickoff")
    end

    feature "quick add scopes templates by space and requires a start date", ctx do
      ctx
      |> Steps.setup_company_work_map_with_templates()
      |> Steps.visit_company_work_map()
      |> Steps.open_add_new_item_modal()
      |> Steps.select_add_item_type_project()
      |> Steps.assert_work_map_template_option("General launch kit")
      |> Steps.refute_work_map_template_option("Growth playbook")
      |> Steps.select_work_map_item_space("Growth Space")
      |> Steps.assert_work_map_template_option("Growth playbook")
      |> Steps.refute_work_map_template_option("General launch kit")
      |> Steps.fill_work_map_item_name("Missing start date")
      |> Steps.select_work_map_template("Growth playbook")
      |> Steps.submit_work_map_item_without_start_date()
    end

    feature "template picker is hidden when adding a goal", ctx do
      ctx
      |> Steps.setup_work_map_project_templates()
      |> Steps.visit_company_work_map()
      |> Steps.open_zero_state_add_goal()
      |> Steps.refute_work_map_template_visible()
    end
  end
end
