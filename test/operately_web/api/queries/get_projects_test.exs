defmodule OperatelyWeb.Api.Queries.GetProjectsTest do
  use OperatelyWeb.TurboCase

  import Operately.ProjectsFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures

  import OperatelyWeb.Api.Serializer

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_projects, %{})
    end
  end

  describe "get_projects functionality" do
    setup :register_and_log_in_account

    test "calling with no input filters returns all projects from the company", ctx do
      project1 = project_fixture(company_id: ctx.company.id, name: "Project 1", creator_id: ctx.person.id, group_id: ctx.company.company_space_id)
      project2 = project_fixture(company_id: ctx.company.id, name: "Project 2", creator_id: ctx.person.id, group_id: ctx.company.company_space_id)
      project3 = project_fixture(company_id: ctx.company.id, name: "Project 3", creator_id: ctx.person.id, group_id: ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_projects, %{})
      assert res.projects == serialize([project1, project2, project3], level: :full)
    end

    test "include_champion", ctx do
      project = project_fixture(company_id: ctx.company.id, name: "Project 1", creator_id: ctx.person.id, group_id: ctx.company.company_space_id)
      project = Map.put(project, :champion_id, ctx.person.id)
      project = Map.put(project, :champion, ctx.person)

      assert {200, res} = query(ctx.conn, :get_projects, %{include_champion: true})
      assert res.projects == serialize([project], level: :full)
    end

    test "include_space", ctx do
      space = group_fixture(ctx.person, company_id: ctx.company.id, name: "Space 1")
      project = project_fixture(company_id: ctx.company.id, name: "Project 1", creator_id: ctx.person.id, group_id: space.id)

      assert {200, res} = query(ctx.conn, :get_projects, %{})
      assert res.projects |> hd() |> Map.get(:space) == nil

      assert {200, res} = query(ctx.conn, :get_projects, %{include_space: true})
      assert res.projects |> hd() |> Map.get(:space) == serialize(space, level: :essential)
    end

    test "include_goal", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)
      project = project_fixture(company_id: ctx.company.id, name: "Project 1", creator_id: ctx.person.id, group_id: ctx.company.company_space_id, goal_id: goal.id)
      project = Map.put(project, :goal, goal)

      assert {200, res} = query(ctx.conn, :get_projects, %{include_goal: true})
      assert res.projects == serialize([project], level: :full)
    end

    test "if include_milestones is true, but there are no milestones it returns empty list and next_milestone = nil", ctx do
      project = project_fixture(company_id: ctx.company.id, name: "Project 1", creator_id: ctx.person.id, group_id: ctx.company.company_space_id)
      project = Map.put(project, :milestones, [])

      assert {200, res} = query(ctx.conn, :get_projects, %{include_milestones: true})
      assert res.projects == serialize([project], level: :full)
    end

    test "if include_last_check_in is true, but there is no last check in, it returns nil", ctx do
      project = project_fixture(company_id: ctx.company.id, name: "Project 1", creator_id: ctx.person.id, group_id: ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_projects, %{include_last_check_in: true})
      assert res.projects == serialize([project], level: :full)
    end
  end
end 
