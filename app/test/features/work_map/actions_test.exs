defmodule Operately.Features.WorkMap.ActionsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.{CompaniesSteps, WorkMapSteps}

  feature "organizing stages a parent change until saved", ctx do
    ctx
    |> WorkMapSteps.setup_company_work_map()
    |> Factory.enable_feature("work_map_v2")
    |> WorkMapSteps.visit_company_work_map()
    |> WorkMapSteps.stage_project_at_top_level()
    |> WorkMapSteps.cancel_map_changes()
    |> WorkMapSteps.stage_project_at_top_level()
    |> WorkMapSteps.save_project_at_top_level()
  end

  feature "the first company project opens with the owner as champion", ctx do
    ctx
    |> WorkMapSteps.setup_first_company_map()
    |> Factory.enable_feature("work_map_v2")
    |> WorkMapSteps.visit_company_work_map()
    |> CompaniesSteps.create_first_project()
    |> CompaniesSteps.assert_first_project_defaults()
  end

  feature "choosing a space template creates a project with its milestones", ctx do
    ctx
    |> WorkMapSteps.setup_empty_space_work_map_with_templates()
    |> Factory.add_goal(:goal, :space)
    |> Factory.enable_feature("work_map_v2")
    |> WorkMapSteps.visit_space_work_map(:space)
    |> WorkMapSteps.choose_project_template()
    |> WorkMapSteps.fill_work_map_item_name("Product launch")
    |> WorkMapSteps.select_work_map_start_date()
    |> WorkMapSteps.submit_work_map_item()
    |> WorkMapSteps.assert_project_created_from_work_map_template(name: "Product launch", milestone: "Kickoff")
  end

  feature "a project editor with full access can assign a reviewer from the table", ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:candidate, :space, name: "Reviewer Candidate")
    |> Factory.add_project(:project, :space, champion: :creator)
    |> Factory.enable_feature("work_map_v2")
    |> Factory.log_in_person(:creator)
    |> WorkMapSteps.visit_space_work_map(:space)
    |> WorkMapSteps.assign_project_reviewer()
  end

  feature "viewers can open work without organization, reviewer, or creation controls", ctx do
    ctx
    |> WorkMapSteps.setup_spaces()
    |> WorkMapSteps.given_there_are_items_in_spaces()
    |> Factory.enable_feature("work_map_v2")
    |> WorkMapSteps.visit_space_work_map(:view_space)
    |> WorkMapSteps.assert_read_only_map()
  end

  feature "an empty private space keeps company access out of quick add", ctx do
    ctx
    |> WorkMapSteps.setup_empty_private_space_work_map()
    |> Factory.enable_feature("work_map_v2")
    |> WorkMapSteps.visit_space_work_map(:space)
    |> WorkMapSteps.open_zero_state_add_goal()
    |> WorkMapSteps.open_quick_add_privacy_settings()
    |> WorkMapSteps.refute_company_members_permissions_visible()
  end
end
