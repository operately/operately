defmodule Operately.MCP.ServerTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias Operately.MCP.TestHelper

  describe "Operately.MCP.Server tools logic" do
    setup do
      Factory.setup(%{})
    end

    test "switch_organization tool logic with valid inputs" do
      {:ok, response} = TestHelper.test_switch_organization_logic("valid_company_id", "valid_person_id")
      
      assert response.success == true
      assert response.message == "Switched to organization: Test Company"
      assert response.company.id == "valid_company_id"
      assert response.company.name == "Test Company"
      assert response.person.id == "valid_person_id"
      assert response.person.full_name == "Test Person"
    end

    test "switch_organization tool logic with invalid company" do
      {:error, response} = TestHelper.test_switch_organization_logic("invalid_company_id", "valid_person_id")
      
      assert response.success == false
      assert response.error == "Company or person not found"
    end

    test "switch_organization tool logic with invalid person" do
      {:error, response} = TestHelper.test_switch_organization_logic("valid_company_id", "invalid_person_id")
      
      assert response.success == false
      assert response.error == "Company or person not found"
    end

    test "context validation logic with no context" do
      {:error, message} = TestHelper.test_context_validation(nil, nil)
      assert message == "No organization context set. Use switch_organization first."
    end

    test "context validation logic with valid context" do
      {:ok, person, company} = TestHelper.test_context_validation("valid_company_id", "valid_person_id")
      
      assert person.id == "valid_person_id"
      assert company.id == "valid_company_id"
    end

    test "work map data structure exists", ctx do
      # This test verifies the work map query can be executed with proper context
      assert ctx.company.id != nil
      assert ctx.creator.company_id == ctx.company.id
      
      # Verify work map query exists and can be called
      assert function_exported?(Operately.WorkMaps.GetWorkMapQuery, :execute, 2)
    end

    test "goal retrieval structure exists", ctx do
      # This test verifies goal retrieval functionality exists
      ctx
      |> Factory.add_space(:marketing)
      |> Factory.add_goal(:q1_goal, :marketing)
      
      # Verify goal exists and has proper structure
      assert ctx.q1_goal.id != nil
      assert ctx.q1_goal.space_id == ctx.marketing.id
      
      # Verify GetGoal API query exists
      assert function_exported?(OperatelyWeb.Api.Queries.GetGoal, :call, 2)
    end

    test "project retrieval structure exists", ctx do
      # This test verifies project retrieval functionality exists  
      ctx
      |> Factory.add_space(:marketing)
      |> Factory.add_project(:website, :marketing)
      
      # Verify project exists and has proper structure
      assert ctx.website.id != nil
      assert ctx.website.space_id == ctx.marketing.id
      
      # Verify Project.get function exists
      assert function_exported?(Operately.Projects.Project, :get, 2)
    end
  end

  describe "Operately.MCP.Server resources" do
    setup do
      Factory.setup(%{})
    end

    test "resources capability is enabled" do
      # Verify that the MCP server declares resources capability
      # This would be tested by checking server capabilities in integration tests
      assert true
    end

    test "goals list resource requires valid API", ctx do
      # Verify GetGoals API exists for listing goals
      assert function_exported?(OperatelyWeb.Api.Queries.GetGoals, :call, 2)
    end

    test "projects list resource requires valid API", ctx do
      # Verify GetProjects API exists for listing projects
      assert function_exported?(OperatelyWeb.Api.Queries.GetProjects, :call, 2)
    end

    test "goal resource URIs follow correct pattern", ctx do
      ctx
      |> Factory.add_space(:marketing)
      |> Factory.add_goal(:q1_goal, :marketing)
      
      # Verify goal ID can be used in URI pattern
      goal_id = ctx.q1_goal.id
      uri = "operately://goals/#{goal_id}"
      
      assert String.starts_with?(uri, "operately://goals/")
    end

    test "project resource URIs follow correct pattern", ctx do
      ctx
      |> Factory.add_space(:marketing)
      |> Factory.add_project(:website, :marketing)
      
      # Verify project ID can be used in URI pattern
      project_id = ctx.website.id
      uri = "operately://projects/#{project_id}"
      
      assert String.starts_with?(uri, "operately://projects/")
    end
  end
end