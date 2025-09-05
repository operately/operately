defmodule OperatelyEE.AdminApi.Queries.GetActiveCompaniesTest do
  use Operately.DataCase

  alias OperatelyEE.AdminApi.Queries.GetActiveCompanies
  alias Operately.Activities
  
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures
  import Operately.ProjectsFixtures

  describe "GetActiveCompanies.call/2" do
    test "returns empty list when no companies exist" do
      assert {:ok, %{companies: []}} = GetActiveCompanies.call(nil, %{})
    end

    test "returns empty list when no companies meet activity criteria" do
      # Create a company that doesn't meet the criteria
      company = company_fixture()
      
      # Only has 1 member (the creator), no goals, no projects, no recent activity
      assert {:ok, %{companies: []}} = GetActiveCompanies.call(nil, %{})
    end

    test "returns companies that meet all activity criteria" do
      company = company_fixture()
      group = group_fixture(company.company_owner, %{company_id: company.id})
      
      # Add multiple members (≥ 2)
      member1 = person_fixture_with_account(%{company_id: company.id})
      member2 = person_fixture_with_account(%{company_id: company.id})
      
      # Add multiple goals (≥ 2) 
      goal1 = goal_fixture(member1, %{group_id: group.id})
      goal2 = goal_fixture(member2, %{group_id: group.id})
      
      # Add multiple projects (≥ 2)
      project1 = project_fixture(%{company_id: company.id, creator_id: member1.id, group_id: group.id})
      project2 = project_fixture(%{company_id: company.id, creator_id: member2.id, group_id: group.id})
      
      # Add recent activity (within 14 days)
      create_recent_activity(company)
      
      {:ok, result} = GetActiveCompanies.call(nil, %{})
      
      assert length(result.companies) == 1
      assert Enum.any?(result.companies, &(&1.name == company.name))
      
      active_company = Enum.find(result.companies, &(&1.name == company.name))
      assert active_company.people_count >= 2
      assert active_company.goals_count >= 2
      assert active_company.projects_count >= 2
      assert active_company.last_activity_at != nil
    end

    test "excludes companies with insufficient members" do
      company = company_fixture()
      group = group_fixture(company.company_owner, %{company_id: company.id})
      
      # Only has 1 member (the creator) 
      # Add goals and projects
      member = person_fixture_with_account(%{company_id: company.id})
      goal_fixture(member, %{group_id: group.id})
      goal_fixture(member, %{group_id: group.id})
      project_fixture(%{company_id: company.id, creator_id: member.id, group_id: group.id})
      project_fixture(%{company_id: company.id, creator_id: member.id, group_id: group.id})
      
      # Add recent activity
      create_recent_activity(company)
      
      {:ok, result} = GetActiveCompanies.call(nil, %{})
      assert result.companies == []
    end

    test "excludes companies with insufficient goals" do
      company = company_fixture()
      group = group_fixture(company.company_owner, %{company_id: company.id})
      
      # Add members and projects but only 1 goal
      member1 = person_fixture_with_account(%{company_id: company.id})
      member2 = person_fixture_with_account(%{company_id: company.id})
      goal_fixture(member1, %{group_id: group.id})  # Only 1 goal
      project_fixture(%{company_id: company.id, creator_id: member1.id, group_id: group.id})
      project_fixture(%{company_id: company.id, creator_id: member2.id, group_id: group.id})
      
      # Add recent activity
      create_recent_activity(company)
      
      {:ok, result} = GetActiveCompanies.call(nil, %{})
      assert result.companies == []
    end

    test "excludes companies with insufficient projects" do
      company = company_fixture()
      group = group_fixture(company.company_owner, %{company_id: company.id})
      
      # Add members and goals but only 1 project
      member1 = person_fixture_with_account(%{company_id: company.id})
      member2 = person_fixture_with_account(%{company_id: company.id})
      goal_fixture(member1, %{group_id: group.id})
      goal_fixture(member2, %{group_id: group.id})
      project_fixture(%{company_id: company.id, creator_id: member1.id, group_id: group.id})  # Only 1 project
      
      # Add recent activity
      create_recent_activity(company)
      
      {:ok, result} = GetActiveCompanies.call(nil, %{})
      assert result.companies == []
    end

    test "excludes companies without recent activity" do
      company = company_fixture()
      group = group_fixture(company.company_owner, %{company_id: company.id})
      
      # Add members, goals, and projects
      member1 = person_fixture_with_account(%{company_id: company.id})
      member2 = person_fixture_with_account(%{company_id: company.id})
      goal_fixture(member1, %{group_id: group.id})
      goal_fixture(member2, %{group_id: group.id})
      project_fixture(%{company_id: company.id, creator_id: member1.id, group_id: group.id})
      project_fixture(%{company_id: company.id, creator_id: member2.id, group_id: group.id})
      
      # No recent activity or activity older than 14 days
      create_old_activity(company)
      
      {:ok, result} = GetActiveCompanies.call(nil, %{})
      assert result.companies == []
    end

    test "excludes companies with activity exactly 15 days old" do
      company = company_fixture()
      group = group_fixture(company.company_owner, %{company_id: company.id})
      
      # Add members, goals, and projects
      member1 = person_fixture_with_account(%{company_id: company.id})
      member2 = person_fixture_with_account(%{company_id: company.id})
      goal_fixture(member1, %{group_id: group.id})
      goal_fixture(member2, %{group_id: group.id})
      project_fixture(%{company_id: company.id, creator_id: member1.id, group_id: group.id})
      project_fixture(%{company_id: company.id, creator_id: member2.id, group_id: group.id})
      
      # Add activity exactly 15 days old (should be excluded)
      activity_date = DateTime.add(DateTime.utc_now(), -15, :day)
      create_activity_at_date(company, activity_date)
      
      {:ok, result} = GetActiveCompanies.call(nil, %{})
      assert result.companies == []
    end

    test "includes companies with activity exactly 14 days old" do
      company = company_fixture()
      group = group_fixture(company.company_owner, %{company_id: company.id})
      
      # Add members, goals, and projects
      member1 = person_fixture_with_account(%{company_id: company.id})
      member2 = person_fixture_with_account(%{company_id: company.id})
      goal_fixture(member1, %{group_id: group.id})
      goal_fixture(member2, %{group_id: group.id})
      project_fixture(%{company_id: company.id, creator_id: member1.id, group_id: group.id})
      project_fixture(%{company_id: company.id, creator_id: member2.id, group_id: group.id})
      
      # Add activity exactly 14 days old (should be included)
      activity_date = DateTime.add(DateTime.utc_now(), -14, :day)
      create_activity_at_date(company, activity_date)
      
      {:ok, result} = GetActiveCompanies.call(nil, %{})
      assert length(result.companies) == 1
    end

    test "serializes company data correctly" do
      company = company_fixture()
      group = group_fixture(company.company_owner, %{company_id: company.id})
      
      # Add members, goals, and projects
      member1 = person_fixture_with_account(%{company_id: company.id})
      member2 = person_fixture_with_account(%{company_id: company.id})
      goal_fixture(member1, %{group_id: group.id})
      goal_fixture(member2, %{group_id: group.id})
      project_fixture(%{company_id: company.id, creator_id: member1.id, group_id: group.id})
      project_fixture(%{company_id: company.id, creator_id: member2.id, group_id: group.id})
      
      # Add recent activity
      create_recent_activity(company)
      
      {:ok, result} = GetActiveCompanies.call(nil, %{})
      
      assert length(result.companies) == 1
      company_data = hd(result.companies)
      
      # Verify required fields are present
      assert Map.has_key?(company_data, :id)
      assert Map.has_key?(company_data, :name)
      assert Map.has_key?(company_data, :people_count)
      assert Map.has_key?(company_data, :goals_count)
      assert Map.has_key?(company_data, :spaces_count)
      assert Map.has_key?(company_data, :projects_count)
      assert Map.has_key?(company_data, :owners)
      assert Map.has_key?(company_data, :last_activity_at)
      assert Map.has_key?(company_data, :inserted_at)
      
      # Verify data types and values
      assert is_binary(company_data.id)
      assert is_binary(company_data.name)
      assert is_integer(company_data.people_count)
      assert is_integer(company_data.goals_count)
      assert is_integer(company_data.spaces_count)
      assert is_integer(company_data.projects_count)
      assert is_list(company_data.owners)
    end
  end

  # Helper functions to create test data

  defp create_recent_activity(company) do
    # Create activity within the last 14 days
    activity_date = DateTime.add(DateTime.utc_now(), -7, :day)
    create_activity_at_date(company, activity_date)
  end

  defp create_old_activity(company) do
    # Create activity older than 14 days
    activity_date = DateTime.add(DateTime.utc_now(), -20, :day)
    create_activity_at_date(company, activity_date)
  end

  defp create_activity_at_date(company, date) do
    # Create an activity with specific date and company_id in content
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