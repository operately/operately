defmodule OperatelyWeb.Api.Queries.GetProjectsTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures
  import OperatelyWeb.Api.Serializer

  alias Operately.Repo
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_projects, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})
      space_id = Paths.space_id(space)

      Map.merge(ctx, %{space: space, space_id: space_id, creator: creator})
    end

    test "company members have no access", ctx do
      Enum.each(1..3, fn _ ->
        create_project(ctx, company_access: Binding.no_access())
      end)

      assert {200, res} = query(ctx.conn, :get_projects, %{space_id: ctx.space_id})
      assert length(res.projects) == 0

      project = create_project(ctx, company_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_projects, %{space_id: ctx.space_id})
      assert_projects(res, [project])
    end

    test "company members have access", ctx do
      create_project(ctx, company_access: Binding.no_access())
      projects = Enum.map(1..3, fn _ ->
        create_project(ctx, company_access: Binding.view_access())
      end)

      assert {200, res} = query(ctx.conn, :get_projects, %{space_id: ctx.space_id})
      assert_projects(res, projects)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)

      Enum.each(1..3, fn _ ->
        create_project(ctx, space_access: Binding.no_access())
      end)

      assert {200, res} = query(ctx.conn, :get_projects, %{space_id: ctx.space_id})
      assert length(res.projects) == 0

      project = create_project(ctx, space_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_projects, %{space_id: ctx.space_id})
      assert_projects(res, [project])
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)

      projects = Enum.map(1..3, fn _ ->
        create_project(ctx, space_access: Binding.view_access())
      end)

      assert {200, res} = query(ctx.conn, :get_projects, %{space_id: ctx.space_id})
      assert_projects(res, projects)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, champion_id: champion.id)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, :get_projects, %{space_id: ctx.space_id})
      assert_projects(res, [project])

      # another user's request
      assert {200, res} = query(ctx.conn, :get_projects, %{space_id: ctx.space_id})
      assert length(res.projects) == 0
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, reviewer_id: reviewer.id)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, :get_projects, %{space_id: ctx.space_id})
      assert_projects(res, [project])

      # another user's request
      assert {200, res} = query(ctx.conn, :get_projects, %{space_id: ctx.space_id})
      assert length(res.projects) == 0
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

    test "include_reviewer", ctx do
      project_fixture(company_id: ctx.company.id, name: "Project 1", creator_id: ctx.person.id, reviewer_id: ctx.person.id, group_id: ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_projects, %{})

      assert length(res.projects) == 1
      refute hd(res.projects).reviewer

      assert {200, res} = query(ctx.conn, :get_projects, %{include_reviewer: true})

      assert length(res.projects) == 1
      assert hd(res.projects).reviewer == serialize(ctx.person)
    end

    test "include_space", ctx do
      space = group_fixture(ctx.person, company_id: ctx.company.id, name: "Space 1")
      project_fixture(company_id: ctx.company.id, name: "Project 1", creator_id: ctx.person.id, group_id: space.id)

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

    test "scope by space_id", ctx do
      space = group_fixture(ctx.person, company_id: ctx.company.id, name: "Space 1")
      project1 = project_fixture(company_id: ctx.company.id, name: "Project 1", creator_id: ctx.person.id, group_id: space.id)
      _project2 = project_fixture(company_id: ctx.company.id, name: "Project 2", creator_id: ctx.person.id, group_id: ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_projects, %{space_id: Paths.space_id(space)})
      assert res.projects == serialize([project1], level: :full)
    end
  end

  #
  # Helpers
  #

  defp create_project(ctx, opts) do
    company_access = Keyword.get(opts, :company_access, Binding.no_access())
    space_access = Keyword.get(opts, :space_access, Binding.no_access())
    champion_id = Keyword.get(opts, :champion_id, ctx.creator.id)
    reviewer_id = Keyword.get(opts, :reviewer_id, ctx.creator.id)

    project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.creator.id,
      champion_id: champion_id,
      reviewer_id: reviewer_id,
      group_id: ctx.space.id,
      company_access_level: company_access,
      space_access_level: space_access,
    })
  end

  defp assert_projects(res, projects) do
    assert length(res.projects) == length(projects)

    Enum.each(projects, fn p ->
      assert Enum.find(res.projects, &(&1.id == Paths.project_id(p)))
    end)
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      access_level: Binding.edit_access(),
    }])
  end
end
