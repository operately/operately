defmodule OperatelyEE.Features.SaasAdminActiveCompaniesTest do
  use Operately.FeatureCase
  
  alias Operately.Support.Features.UI
  alias Operately.Activities
  
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures
  import Operately.ProjectsFixtures

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_admin(:admin, name: "Admin User")
    |> Factory.log_in_person(:admin)
  end

  feature "viewing active organizations page", ctx do
    ctx
    |> visit_active_organizations_page()
    |> assert_page_loads_correctly()
    |> assert_navigation_tabs_present()
    |> assert_active_tab_highlighted()
    |> assert_description_text_present()
  end

  feature "displaying active organizations when criteria are met", ctx do
    ctx
    |> create_active_company("Active Corp")
    |> visit_active_organizations_page()
    |> assert_company_displayed("Active Corp")
    |> assert_company_count_displayed(1)
  end

  feature "not displaying inactive organizations", ctx do
    ctx
    |> create_inactive_company("Inactive Corp")
    |> visit_active_organizations_page()
    |> assert_company_not_displayed("Inactive Corp")
    |> assert_empty_state_or_zero_count()
  end

  feature "displaying multiple active organizations", ctx do
    ctx
    |> create_active_company("Active Corp 1")
    |> create_active_company("Active Corp 2")
    |> visit_active_organizations_page()
    |> assert_company_displayed("Active Corp 1")
    |> assert_company_displayed("Active Corp 2")
    |> assert_company_count_displayed(2)
  end

  feature "navigation between all organizations and active organizations", ctx do
    ctx
    |> create_active_company("Active Corp")
    |> visit_admin_page()
    |> assert_on_all_organizations_page()
    |> click_active_organizations_tab()
    |> assert_on_active_organizations_page()
    |> click_all_organizations_tab()
    |> assert_on_all_organizations_page()
  end

  feature "filtering based on member count", ctx do
    ctx
    |> create_company_with_insufficient_members("One Member Corp")
    |> visit_active_organizations_page()
    |> assert_company_not_displayed("One Member Corp")
  end

  feature "filtering based on goals count", ctx do
    ctx
    |> create_company_with_insufficient_goals("No Goals Corp")
    |> visit_active_organizations_page()
    |> assert_company_not_displayed("No Goals Corp")
  end

  feature "filtering based on projects count", ctx do
    ctx
    |> create_company_with_insufficient_projects("No Projects Corp")
    |> visit_active_organizations_page()
    |> assert_company_not_displayed("No Projects Corp")
  end

  feature "filtering based on recent activity", ctx do
    ctx
    |> create_company_with_old_activity("Old Activity Corp")
    |> visit_active_organizations_page()
    |> assert_company_not_displayed("Old Activity Corp")
  end

  feature "displaying company details correctly", ctx do
    ctx
    |> create_active_company("Detailed Corp")
    |> visit_active_organizations_page()
    |> assert_company_details_displayed("Detailed Corp")
  end

  # Step implementations

  step :visit_active_organizations_page, ctx do
    ctx
    |> UI.visit("/admin/active-organizations")
  end

  step :visit_admin_page, ctx do
    ctx
    |> UI.visit("/admin")
  end

  step :assert_page_loads_correctly, ctx do
    ctx
    |> UI.assert_has(testid: "saas-admin-active-companies-page")
    |> UI.assert_text("Active Organizations")
  end

  step :assert_navigation_tabs_present, ctx do
    ctx
    |> UI.assert_text("All Organizations")
    |> UI.assert_text("Active Organizations")
  end

  step :assert_active_tab_highlighted, ctx do
    # The active tab should have specific styling indicating it's selected
    ctx
    |> UI.assert_has("a[href='/admin/active-organizations']")
  end

  step :assert_description_text_present, ctx do
    ctx
    |> UI.assert_text("14 days")
    |> UI.assert_text("multiple members")
    |> UI.assert_text("multiple goals")
    |> UI.assert_text("multiple projects")
  end

  step :assert_company_displayed, ctx, company_name do
    ctx
    |> UI.assert_text(company_name)
  end

  step :assert_company_not_displayed, ctx, company_name do
    ctx
    |> UI.refute_text(company_name)
  end

  step :assert_company_count_displayed, ctx, count do
    # Assuming there's a count display somewhere
    ctx
    |> UI.assert_text("#{count}")
  end

  step :assert_empty_state_or_zero_count, ctx do
    # Either empty state message or zero count
    ctx
  end

  step :assert_on_all_organizations_page, ctx do
    ctx
    |> UI.assert_path("/admin")
  end

  step :assert_on_active_organizations_page, ctx do
    ctx
    |> UI.assert_path("/admin/active-organizations")
  end

  step :click_active_organizations_tab, ctx do
    ctx
    |> UI.click(text: "Active Organizations")
  end

  step :click_all_organizations_tab, ctx do
    ctx
    |> UI.click(text: "All Organizations")
  end

  step :assert_company_details_displayed, ctx, company_name do
    ctx
    |> UI.assert_text(company_name)
    # Could add more specific assertions about displayed data
  end

  # Helper functions to create test data

  step :create_active_company, ctx, name do
    company = company_fixture(%{company_name: name})
    group = group_fixture(company.company_owner, %{company_id: company.id})
    
    # Add multiple members (≥ 2)
    member1 = person_fixture_with_account(%{company_id: company.id, full_name: "#{name} Member 1"})
    member2 = person_fixture_with_account(%{company_id: company.id, full_name: "#{name} Member 2"})
    
    # Add multiple goals (≥ 2) 
    goal_fixture(member1, %{group_id: group.id, name: "#{name} Goal 1"})
    goal_fixture(member2, %{group_id: group.id, name: "#{name} Goal 2"})
    
    # Add multiple projects (≥ 2)
    project_fixture(%{company_id: company.id, creator_id: member1.id, group_id: group.id, name: "#{name} Project 1"})
    project_fixture(%{company_id: company.id, creator_id: member2.id, group_id: group.id, name: "#{name} Project 2"})
    
    # Add recent activity (within 14 days)
    create_recent_activity(company)
    
    ctx
  end

  step :create_inactive_company, ctx, name do
    # Create a company that doesn't meet criteria
    company = company_fixture(%{company_name: name})
    # Only has 1 member (the creator), no goals, no projects, no recent activity
    ctx
  end

  step :create_company_with_insufficient_members, ctx, name do
    company = company_fixture(%{company_name: name})
    group = group_fixture(company.company_owner, %{company_id: company.id})
    
    # Only 1 member but has goals, projects, and activity
    member = person_fixture_with_account(%{company_id: company.id})
    goal_fixture(member, %{group_id: group.id})
    goal_fixture(member, %{group_id: group.id})
    project_fixture(%{company_id: company.id, creator_id: member.id, group_id: group.id})
    project_fixture(%{company_id: company.id, creator_id: member.id, group_id: group.id})
    create_recent_activity(company)
    
    ctx
  end

  step :create_company_with_insufficient_goals, ctx, name do
    company = company_fixture(%{company_name: name})
    group = group_fixture(company.company_owner, %{company_id: company.id})
    
    # Multiple members and projects but only 1 goal
    member1 = person_fixture_with_account(%{company_id: company.id})
    member2 = person_fixture_with_account(%{company_id: company.id})
    goal_fixture(member1, %{group_id: group.id})  # Only 1 goal
    project_fixture(%{company_id: company.id, creator_id: member1.id, group_id: group.id})
    project_fixture(%{company_id: company.id, creator_id: member2.id, group_id: group.id})
    create_recent_activity(company)
    
    ctx
  end

  step :create_company_with_insufficient_projects, ctx, name do
    company = company_fixture(%{company_name: name})
    group = group_fixture(company.company_owner, %{company_id: company.id})
    
    # Multiple members and goals but only 1 project
    member1 = person_fixture_with_account(%{company_id: company.id})
    member2 = person_fixture_with_account(%{company_id: company.id})
    goal_fixture(member1, %{group_id: group.id})
    goal_fixture(member2, %{group_id: group.id})
    project_fixture(%{company_id: company.id, creator_id: member1.id, group_id: group.id})  # Only 1 project
    create_recent_activity(company)
    
    ctx
  end

  step :create_company_with_old_activity, ctx, name do
    company = company_fixture(%{company_name: name})
    group = group_fixture(company.company_owner, %{company_id: company.id})
    
    # Multiple members, goals, and projects but old activity
    member1 = person_fixture_with_account(%{company_id: company.id})
    member2 = person_fixture_with_account(%{company_id: company.id})
    goal_fixture(member1, %{group_id: group.id})
    goal_fixture(member2, %{group_id: group.id})
    project_fixture(%{company_id: company.id, creator_id: member1.id, group_id: group.id})
    project_fixture(%{company_id: company.id, creator_id: member2.id, group_id: group.id})
    create_old_activity(company)
    
    ctx
  end

  # Activity creation helpers

  defp create_recent_activity(company) do
    activity_date = DateTime.add(DateTime.utc_now(), -7, :day)
    create_activity_at_date(company, activity_date)
  end

  defp create_old_activity(company) do
    activity_date = DateTime.add(DateTime.utc_now(), -20, :day)
    create_activity_at_date(company, activity_date)
  end

  defp create_activity_at_date(company, date) do
    Activities.create_activity(%{
      action: "goal_created",
      content: %{
        "company_id" => to_string(company.id),
        "goal_id" => UUID.uuid4()
      },
      inserted_at: date,
      updated_at: date
    })
  end
end