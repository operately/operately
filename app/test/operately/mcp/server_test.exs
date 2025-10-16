defmodule Operately.MCP.ServerTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias Operately.MCP.TestHelper

  describe "search tool behaviour" do
    setup do
      ctx = Factory.setup(%{})
      [ctx: ctx]
    end

    test "returns goal and project matches when query is blank" do
      results = TestHelper.simulate_search("")
      assert Enum.count(results) == 4

      assert Enum.any?(results, &match?(%{metadata: %{type: "goal"}}, &1))
      assert Enum.any?(results, &match?(%{metadata: %{type: "project"}}, &1))
    end

    test "filters results using case-insensitive substring matching" do
      results = TestHelper.simulate_search("activation")

      assert [
               %{
                 id: "operately://goals/goal-1",
                 title: "Improve activation",
                 metadata: %{type: "goal"}
               }
             ] = results
    end

    test "returns empty list when nothing matches" do
      assert [] = TestHelper.simulate_search("non-existent")
    end
  end

  describe "fetch tool behaviour" do
    setup do
      ctx = Factory.setup(%{})
      [ctx: ctx]
    end

    test "fetches goal content" do
      assert {:ok, goal} = TestHelper.simulate_fetch("operately://goals/goal-1")

      assert goal.id == "operately://goals/goal-1"
      assert goal.metadata.type == "goal"
      assert goal.text =~ "Goal"
    end

    test "fetches project content" do
      assert {:ok, project} = TestHelper.simulate_fetch("operately://projects/project-2")

      assert project.id == "operately://projects/project-2"
      assert project.metadata.type == "project"
      assert project.text =~ "Project"
    end

    test "returns error for unsupported identifier" do
      assert {:error, "Unsupported document identifier"} = TestHelper.simulate_fetch("operately://unknown/1")
    end
  end

  describe "dependency checks" do
    test "search requires goals and projects queries" do
      assert {:module, _} = Code.ensure_loaded(OperatelyWeb.Api.Queries.GetGoals)
      assert function_exported?(OperatelyWeb.Api.Queries.GetGoals, :call, 2)

      assert {:module, _} = Code.ensure_loaded(OperatelyWeb.Api.Queries.GetProjects)
      assert function_exported?(OperatelyWeb.Api.Queries.GetProjects, :call, 2)
    end

    test "fetch requires goal query and project renderer" do
      assert {:module, _} = Code.ensure_loaded(OperatelyWeb.Api.Queries.GetGoal)
      assert function_exported?(OperatelyWeb.Api.Queries.GetGoal, :call, 2)

      assert {:module, _} = Code.ensure_loaded(Operately.MD.Project)
      assert function_exported?(Operately.MD.Project, :render, 1)
    end
  end
end
